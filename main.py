import asyncio
import hashlib
import shutil
import uuid
import zipfile
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from fastapi.templating import Jinja2Templates
import socketio

from document_converter import DocumentConverter


# --- Configuration ---
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# --- FastAPI Setup ---
app = FastAPI()
templates = Jinja2Templates(directory="static")

# --- Socket.IO Setup (Async Mode) ---
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# --- Helper: Run Sync Code in Async Context ---
async def run_conversion(func):
    """Wrapper to run synchronous conversion in a thread pool."""
    loop = asyncio.get_event_loop()
    print("[Backend] Running conversion in thread pool...")
    return await loop.run_in_executor(None, func)

def delete_file_task(path: Path):
    """Helper function to delete a file safely."""
    try:
        if path.exists():
            path.unlink()
            print(f"[Cleanup] Deleted output file: {path}")
    except Exception as e:
        print(f"[Cleanup] Error deleting {path}: {e}")

# --- Routes ---

@app.get("/")
async def read_root():
    return templates.TemplateResponse("index.html", {"request": {}})

@app.post("/api/upload")
async def upload_file(files: list[UploadFile] = File(...)):
    """
    Handles:
    1. Single file upload (.ipynb, .md)
    2. Folder upload (drag/drop or select folder) - preserves structure
    3. ZIP file upload - extracts and preserves structure
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    file_id = str(uuid.uuid4())
    session_dir = UPLOAD_DIR / file_id
    session_dir.mkdir(parents=True, exist_ok=True)

    main_notebook_rel_path = None

    def find_main_file(search_dir: Path):
        # Prioritize root level files first
        for f in search_dir.iterdir():
            if f.is_file() and f.suffix in ['.ipynb', '.md']:
                return f.relative_to(search_dir)
        # Then search recursively
        for f in search_dir.rglob("*.ipynb"):
            return f.relative_to(search_dir)
        for f in search_dir.rglob("*.md"):
            return f.relative_to(search_dir)
        return None

    # Case 1: ZIP File
    # Check first file for None safety
    first_filename = files[0].filename or ""
    if len(files) == 1 and first_filename.endswith('.zip'):
        zip_path = session_dir / "upload.zip"
        # Safe write
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(files[0].file, buffer)
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(session_dir)
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail="Invalid ZIP file.")
        finally:
            zip_path.unlink()
            await files[0].close()

        main_notebook_rel_path = find_main_file(session_dir)

    # Case 2: Standard Files (Single or Folder)
    else:
        for file in files:
            # Sanitize filename (remove path traversal)
            raw_name = file.filename
            if not raw_name:
                continue
            
            if ".." in raw_name or raw_name.startswith("/"):
                continue 

            file_path = session_dir / raw_name
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Identify main file on the fly (first .ipynb or .md found)
            if main_notebook_rel_path is None and (raw_name.endswith('.ipynb') or raw_name.endswith('.md')):
                main_notebook_rel_path = raw_name

        # Fallback if we didn't find it in the loop
        if not main_notebook_rel_path:
             main_notebook_rel_path = find_main_file(session_dir)

    if not main_notebook_rel_path:
        shutil.rmtree(session_dir)
        raise HTTPException(status_code=400, detail="No .ipynb or .md file found in upload.")

    return {"file_id": file_id, "filename": str(main_notebook_rel_path)}

@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """Serves the converted file and deletes it after sending."""
    file_path = OUTPUT_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    def iterfile():
        """Generator to read file in chunks, then delete."""
        try:
            with open(file_path, "rb") as f:
                yield from f
        finally:
            # This code runs after the download is complete
            try:
                file_path.unlink()
                print(f"[Cleanup] Deleted output file: {file_path}")
            except Exception as e:
                print(f"[Cleanup] Error deleting {file_path}: {e}")

    # Use StreamingResponse to handle the download and cleanup
    return StreamingResponse(
        iterfile(), 
        media_type="application/octet-stream", 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

app.mount("/", StaticFiles(directory="static"), name="static")

# --- Socket.IO Events ---

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def start_conversion(sid, data):
    print(f"\n[Backend] 1. Received 'start_conversion' from {sid}")
    
    file_id = data.get('file_id')
    filename = data.get('filename')
    options = data.get('options', {})
    
    if not file_id or not filename:
         await sio.emit('conversion_error', {'message': 'Missing file ID or filename'}, to=sid)
         return

    # Construct path: uploads/ID/filename
    input_path = UPLOAD_DIR / file_id / filename
    source_root = UPLOAD_DIR / file_id

    print(f"[Backend] Input path: {input_path}")
    print(f"[Backend] Source root: {source_root}")

    if not input_path.exists():
         await sio.emit('conversion_error', {'message': f'Source file not found: {input_path}'}, to=sid)
         return

    clean_title = Path(filename).stem

    def convert_sync():
        print("[Backend Thread] A. Initializing DocumentConverter...")
        try:
            converter = DocumentConverter(
                hide_code=options.get('hide_code', False),
                keep_text=options.get('keep_text', False),
                export_html=options.get('export_html', False),
                export_markdown=options.get('export_markdown', False),
                include_toc=options.get('include_toc', False),
                paper_size=options.get('paper_size', 'A4'),
                doc_title=clean_title,
                header_text=options.get('header_text'),
                page_number_pos=options.get('page_number_pos', 'right'),
                show_page_word=options.get('show_page_word', False),
                text_align=options.get('text_align', 'justify'),
                font_family=options.get('font_family', 'Aptos'),
                font_size_body=options.get('font_size_body', 12),
                font_size_table=options.get('font_size_table', 11),
                font_size_header=options.get('font_size_header', 9),
                font_size_code=options.get('font_size_code', 10),
                resize_images=options.get('resize_images', True),
                resize_tables=options.get('resize_tables', True)          
            )
            print("[Backend Thread] B. Calling converter.convert()...")
            
            # Use title + short hash for a clean, unique output name
            short_hash = hashlib.sha256(file_id.encode()).hexdigest()[:8]
            result = converter.convert(
                input_path,
                output_dir=OUTPUT_DIR,
                base_name=f"{clean_title}_{short_hash}"
            )
            return result
        except Exception as e:
            print(f"[Backend Thread] ERROR: {e}")
            raise e

    try:
        await sio.emit('conversion_progress', {'step': 'processing', 'message': 'Converting document...'}, to=sid)
        
        result = await run_conversion(convert_sync)
        
        payload = {
            "docx": f"api/download/{result.docx.name}" if result.docx else None,
            "html": f"api/download/{result.html.name}" if result.html else None,
            "markdown": f"api/download/{result.markdown.name}" if result.markdown else None
        }
        
        await sio.emit('conversion_complete', payload, to=sid)
        print("[Backend] Emitted 'conversion_complete'")
        
        # --- CLEANUP START ---
        # 1. Clean up the Source Uploads folder for this session
        try:
            upload_session_path = UPLOAD_DIR / file_id
            if upload_session_path.exists():
                shutil.rmtree(upload_session_path)
                print(f"[Backend] Cleaned up upload directory: {file_id}")
        except Exception as e:
            print(f"[Backend] Error cleaning upload directory: {e}")

        # 2. Clean up Template Uploads (if a template was used for this specific session)
        # Note: If templates are stored permanently, skip this. 
        # If templates are treated as temporary (one-time use), uncomment below:
        # if template_id:
        #     try:
        #         template_session_path = UPLOAD_DIR / template_id
        #         if template_session_path.exists(): shutil.rmtree(template_session_path)
        #     except: pass
        
        # --- CLEANUP END ---

    except Exception as e:
        print(f"[Backend] ERROR in event handler: {e}")
        await sio.emit('conversion_error', {'message': str(e)}, to=sid)
