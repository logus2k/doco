export default class FileUploader {
    constructor(dropZoneEl, inputEl, onUploadSuccess) {
        this.dropZone = dropZoneEl;
        this.input = inputEl;
        this.onUploadSuccess = onUploadSuccess;

        // We need the folder input reference as well
        this.folderInput = document.getElementById('folder-input');

        this.bindEvents();
    }

    bindEvents() {
        // --- Button Clicks ---
        
        // "Select File" button triggers the standard file input
        document.getElementById('browse-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.input.click();
        });

        // "Select Folder" button triggers the folder input
        document.getElementById('browse-folder-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.folderInput.click();
        });

        // --- Input Changes ---
        
        this.input.addEventListener('change', (e) => {
            if (e.target.files.length) this.handleFiles(e.target.files);
        });

        this.folderInput.addEventListener('change', (e) => {
            if (e.target.files.length) this.handleFiles(e.target.files);
        });

        // --- Drag & Drop ---
        
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                this.handleFiles(e.dataTransfer.files);
            }
        });
    }

    /**
     * Handles both single files and folder uploads.
     */
    async handleFiles(files) {
        // Convert FileList to Array
        const fileArray = Array.from(files);

        // Filter for supported types
        const validFiles = fileArray.filter(f => 
            f.name.endsWith('.ipynb') || 
            f.name.endsWith('.md') || 
            f.name.endsWith('.zip') ||
            f.type.startsWith('image/') || // Allow images
            f.name.endsWith('.pdf')        // Allow PDFs if referenced
            // Add any other asset types you might reference
        );

        if (validFiles.length === 0) {
            alert('No valid files found (.ipynb, .md, .zip, or images).');
            return;
        }

        // Check if it's a single ZIP file
        const isZip = validFiles.length === 1 && validFiles[0].name.endsWith('.zip');

        if (isZip) {
            await this.uploadFiles([validFiles[0]]);
        } else {
            // It's a notebook + assets or a folder selection
            await this.uploadFiles(validFiles);
        }
    }

    async uploadFiles(files) {
        const formData = new FormData();

        // Skip main file check for ZIP uploads (backend extracts and finds it)
        const isZip = files.length === 1 && files[0].name.endsWith('.zip');
        if (!isZip) {
            const mainFile = files.find(f =>
                f.name.endsWith('.ipynb') || f.name.endsWith('.md')
            );
            if (!mainFile) {
                alert('No .ipynb or .md file found in selection.');
                return;
            }
        }

        // Append all files
        // We use 'webkitRelativePath' if available (folder upload) to preserve directory structure
        files.forEach(file => {
            // If it's a folder upload, path is in webkitRelativePath. If single file, just name.
            const path = file.webkitRelativePath || file.name;
            formData.append('files', file, path);
        });

        try {
            const response = await fetch('api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');
            
            const data = await response.json();
            this.onUploadSuccess(data.file_id, data.filename);
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Upload failed. Check console.');
        }
    }
}
