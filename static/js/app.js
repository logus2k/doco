// Wizard Controller for doco
import FileUploader from './components/FileUploader.js';
import ProgressTracker from './components/ProgressTracker.js';
import SocketService from './services/SocketService.js';

class WizardController {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.fileId = null;
        this.fileName = null;
        this.templateId = null;

        this.init();
    }

    init() {
        this.initComponents();
        this.initWizardNavigation();
        this.initFileUpload();
        this.initConversion();
    }

    initComponents() {
        this.socket = new SocketService();
        this.initConnectionStatus();

        // FileUploader expects DOM elements and a callback
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        const onUploadSuccess = (fileId, filename) => {
            this.fileId = fileId;
            this.fileName = filename;
            this.showFileSelected(filename);
            document.getElementById('btn-next').disabled = false;
        };

        this.fileUploader = new FileUploader(dropZone, fileInput, onUploadSuccess);
        this.progressTracker = new ProgressTracker(document.getElementById('progress-tracker'));
    }

    initConnectionStatus() {
        const statusEl = document.getElementById('connection-status');
        const textEl = statusEl.querySelector('.status-text');

        this.socket.on('connect', () => {
            statusEl.classList.remove('disconnected');
            statusEl.classList.add('connected');
            textEl.textContent = 'Connected';
        });

        this.socket.on('disconnect', () => {
            statusEl.classList.remove('connected');
            statusEl.classList.add('disconnected');
            textEl.textContent = 'Disconnected';
        });
    }

    initWizardNavigation() {
        const btnNext = document.getElementById('btn-next');
        const btnBack = document.getElementById('btn-back');

        btnNext.addEventListener('click', () => this.goToStep(this.currentStep + 1));
        btnBack.addEventListener('click', () => this.goToStep(this.currentStep - 1));

        // Initially, Next button is disabled until file is uploaded
        btnNext.disabled = true;
    }

    goToStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > this.totalSteps) return;

        // Validate current step before moving forward
        if (stepNumber > this.currentStep && !this.validateCurrentStep()) {
            return;
        }

        // Hide current step
        const currentStepEl = document.querySelector('.wizard-step.active');
        if (currentStepEl) {
            currentStepEl.classList.remove('active');
        }

        // Deactivate current stepper
        const currentStepper = document.querySelector(`.step.active`);
        if (currentStepper) {
            currentStepper.classList.remove('active');
            if (stepNumber > this.currentStep) {
                currentStepper.classList.add('completed');
            }
        }

        // Update step
        this.currentStep = stepNumber;

        // Show new step
        const steps = ['upload', 'document', 'layout', 'export', 'process'];
        const newStepEl = document.getElementById(`step-${steps[stepNumber - 1]}`);
        if (newStepEl) {
            newStepEl.classList.add('active');
        }

        // Activate new stepper
        const newStepper = document.querySelector(`.step[data-step="${stepNumber}"]`);
        if (newStepper) {
            newStepper.classList.add('active');
        }

        // Update navigation buttons
        this.updateNavigation();
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1: // Upload step
                return this.fileId !== null;
            case 2: // Document options - always valid
            case 3: // Layout - always valid
            case 4: // Export - always valid
                return true;
            default:
                return true;
        }
    }

    updateNavigation() {
        const btnNext = document.getElementById('btn-next');
        const btnBack = document.getElementById('btn-back');
        const btnStart = document.getElementById('start-btn');

        // Back button
        btnBack.disabled = this.currentStep === 1;

        // Next button (hide on last step)
        if (this.currentStep === 4) {
            btnNext.classList.add('hidden');
            btnStart.classList.remove('hidden');
            btnBack.classList.remove('hidden');
        } else if (this.currentStep < 4) {
            btnNext.classList.remove('hidden');
            btnStart.classList.add('hidden');
            btnBack.classList.remove('hidden');
            btnNext.disabled = !this.validateCurrentStep();
        } else {
            btnNext.classList.add('hidden');
            btnStart.classList.add('hidden');
            btnBack.classList.add('hidden');
        }
    }

    initFileUpload() {
        const removeBtn = document.getElementById('remove-file-btn');

        // Remove file handler
        removeBtn.addEventListener('click', () => {
            this.fileId = null;
            this.fileName = null;
            this.templateId = null;
            document.getElementById('file-selected-info').classList.add('hidden');
            document.getElementById('drop-zone').style.display = '';
            document.getElementById('btn-next').disabled = true;
        });
    }

    showFileSelected(filename) {
        document.getElementById('file-name-display').textContent = filename;
        document.getElementById('file-selected-info').classList.remove('hidden');
        document.getElementById('drop-zone').style.display = 'none';
    }

    initConversion() {
        const startBtn = document.getElementById('start-btn');
        const resetBtn = document.getElementById('reset-btn');

        startBtn.addEventListener('click', () => {
            this.startConversion();
        });

        resetBtn.addEventListener('click', () => {
            this.reset();
        });

        // Socket listeners
        this.socket.on('conversion_progress', (data) => {
            if (data.step === 'processing') {
                this.progressTracker.setStep(1);
            } else if (data.step === 'finalizing') {
                this.progressTracker.setStep(2);
            }
        });

        this.socket.on('conversion_complete', (data) => {
            this.handleConversionComplete(data);
        });

        this.socket.on('conversion_error', (data) => {
            this.handleConversionError(data);
        });
    }

    async startConversion() {
        // Move to processing step
        this.goToStep(5);

        // Hide start button
        document.getElementById('start-btn').classList.add('hidden');

        // Initialize progress tracker
        this.progressTracker.render();
        this.progressTracker.setStep(0); // Start at upload step

        // Gather options
        const options = this.gatherOptions();

        // Emit conversion request
        setTimeout(() => {
            this.progressTracker.setStep(1); // Move to processing
            this.socket.emit('start_conversion', {
                file_id: this.fileId,
                filename: this.fileName,
                options: options
            });
        }, 500);
    }

    gatherOptions() {
        return {
            hide_code: document.getElementById('opt-hide-code').checked,
            keep_text: document.getElementById('opt-keep-text').checked,
            export_html: document.getElementById('opt-export-html').checked,
            export_markdown: document.getElementById('opt-export-md').checked,
            include_toc: document.getElementById('opt-toc').checked,
            paper_size: document.getElementById('opt-paper-size').value,
            header_text: document.getElementById('opt-header-text').value,
            page_number_pos: document.getElementById('opt-page-pos').value,
            show_page_word: document.getElementById('opt-show-page-word').checked,
            text_align: document.getElementById('opt-align').value,
            font_family: document.getElementById('opt-font').value,
            font_size_body: parseInt(document.getElementById('opt-size-body').value),
            font_size_table: parseInt(document.getElementById('opt-size-table').value),
            font_size_header: parseInt(document.getElementById('opt-size-header').value),
            font_size_code: parseInt(document.getElementById('opt-size-code').value),
            resize_images: document.getElementById('opt-resize-images').checked,
            resize_tables: document.getElementById('opt-resize-tables').checked
        };
    }

    handleConversionComplete(data) {
        this.progressTracker.setStep(2); // Finalizing step

        setTimeout(() => {
            // Show results
            const resultArea = document.getElementById('result-area');
            const statusSection = document.getElementById('status-section');

            statusSection.classList.add('hidden');
            resultArea.classList.remove('hidden');

            // Build download links
            const downloadLinks = document.getElementById('download-links');
            downloadLinks.innerHTML = '';

            const markDownloadComplete = () => {
                const downloadStepper = document.querySelector('.step[data-step="5"]');
                if (downloadStepper) {
                    downloadStepper.classList.remove('active');
                    downloadStepper.classList.add('completed');
                }
            };

            if (data.docx) {
                const link = document.createElement('a');
                link.href = data.docx;
                link.textContent = `📄 Download DOCX`;
                link.download = true;
                link.addEventListener('click', markDownloadComplete);
                downloadLinks.appendChild(link);
            }

            if (data.html) {
                const link = document.createElement('a');
                link.href = data.html;
                link.textContent = `🌐 Download HTML`;
                link.download = true;
                link.addEventListener('click', markDownloadComplete);
                downloadLinks.appendChild(link);
            }

            if (data.markdown) {
                const link = document.createElement('a');
                link.href = data.markdown;
                link.textContent = `📝 Download Markdown`;
                link.download = true;
                link.addEventListener('click', markDownloadComplete);
                downloadLinks.appendChild(link);
            }

            // Show reset button
            document.getElementById('reset-btn').classList.remove('hidden');
        }, 500);
    }

    handleConversionError(data) {
        const errorMsg = data.message || data.error || 'Unknown error';
        const progressDiv = document.getElementById('progress-tracker');
        progressDiv.innerHTML = `<div class="error-box"><strong>Error:</strong> ${errorMsg}</div>`;
    }

    reset() {
        // Reset state
        this.fileId = null;
        this.fileName = null;
        this.templateId = null;
        this.currentStep = 1;

        // Clear completed steps
        document.querySelectorAll('.step.completed').forEach(step => {
            step.classList.remove('completed');
        });

        // Reset UI
        document.getElementById('file-selected-info').classList.add('hidden');
        document.getElementById('drop-zone').style.display = '';
        document.getElementById('result-area').classList.add('hidden');
        document.getElementById('status-section').classList.remove('hidden');
        document.getElementById('reset-btn').classList.add('hidden');
        document.getElementById('progress-tracker').innerHTML = '';

        // Reset file inputs
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        const folderInput = document.getElementById('folder-input');
        if (folderInput) folderInput.value = '';

        // Go back to step 1
        this.goToStep(1);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new WizardController();
});
