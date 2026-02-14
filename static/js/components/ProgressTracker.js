export default class ProgressTracker {
    constructor(containerEl) {
        this.container = containerEl;
        this.steps = [
            { id: 'upload', label: 'Uploading' },
            { id: 'processing', label: 'Processing Document' },
            { id: 'finalizing', label: 'Finalizing Output' }
        ];
        this.currentStep = -1;
    }

    render() {
        this.container.innerHTML = this.steps.map((step, index) => `
            <div class="progress-step" data-step="${index}">
                <div class="status-icon">○</div>
                <span>${step.label}</span>
            </div>
        `).join('');
    }

    setStep(index) {
        const nodes = this.container.querySelectorAll('.progress-step');
        nodes.forEach((node, i) => {
            node.classList.remove('active', 'done');
            if (i < index) {
                node.classList.add('done');
                node.querySelector('.status-icon').textContent = '✓';
            } else if (i === index) {
                node.classList.add('active');
                node.querySelector('.status-icon').textContent = '●';
            } else {
                node.querySelector('.status-icon').textContent = '○';
            }
        });
    }
}
