import { LightningElement, api } from 'lwc';
import coverImage from '@salesforce/resourceUrl/CorePressBrochureCover';
import headerLogo from '@salesforce/resourceUrl/CorePressHeaderLogo';
import cp100Image from '@salesforce/resourceUrl/CorePressCP100';
import cp2100Image from '@salesforce/resourceUrl/CorePressCP2100';
import cp7100Image from '@salesforce/resourceUrl/CorePressCP7100';
import healthIcon from '@salesforce/resourceUrl/CorePressHealthIcon';
import supportIcon from '@salesforce/resourceUrl/CorePressSupportIcon';
import maintenanceIcon from '@salesforce/resourceUrl/CorePressMaintenanceIcon';
import portalUserIcon from '@salesforce/resourceUrl/CorePressPortalUserIcon';

export default class CpPortalLanding extends LightningElement {
    @api heroTitle = '공정을 멈추지 않는 서비스';
    @api heroDescription =
        '설치부터 보증, 현장 서비스까지\n압축기의 전체 수명주기를 한곳에서 관리합니다.';
    @api loginUrl = 'login';

    coverImageUrl = coverImage;
    headerLogoUrl = headerLogo;
    cp100ImageUrl = cp100Image;
    cp2100ImageUrl = cp2100Image;
    cp7100ImageUrl = cp7100Image;
    healthIconUrl = healthIcon;
    supportIconUrl = supportIcon;
    maintenanceIconUrl = maintenanceIcon;
    portalUserIconUrl = portalUserIcon;

    animationFrame;
    resizeObserver;
    flowStarted = false;

    renderedCallback() {
        if (this.flowStarted) return;

        const canvas = this.template.querySelector('.time-flow');
        const hero = this.template.querySelector('.hero');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!canvas || !hero || reduceMotion) return;

        this.flowStarted = true;
        const context = canvas.getContext('2d');
        const particles = Array.from({ length: 22 }, (_, index) => ({
            phase: index / 22,
            lane: (index * 37) % 100 / 100,
            speed: 0.012 + (index % 5) * 0.0025,
            size: 0.7 + (index % 3) * 0.45
        }));

        const resize = () => {
            const rect = hero.getBoundingClientRect();
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.max(1, Math.round(rect.width * ratio));
            canvas.height = Math.max(1, Math.round(rect.height * ratio));
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
        };

        const draw = (timestamp) => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            const time = timestamp / 1000;
            context.clearRect(0, 0, width, height);

            const sweepX = ((time * 24) % (width + 360)) - 180;
            const sweep = context.createLinearGradient(sweepX - 150, 0, sweepX + 150, 0);
            sweep.addColorStop(0, 'rgba(46,196,182,0)');
            sweep.addColorStop(0.48, 'rgba(46,196,182,0.045)');
            sweep.addColorStop(0.5, 'rgba(158,244,236,0.12)');
            sweep.addColorStop(0.52, 'rgba(46,196,182,0.045)');
            sweep.addColorStop(1, 'rgba(46,196,182,0)');
            context.fillStyle = sweep;
            context.fillRect(sweepX - 150, 0, 300, height);

            const originX = width * 0.72;
            const originY = height * 0.53;
            for (let ring = 0; ring < 3; ring += 1) {
                const radius = 110 + ring * 82 + (time * 8) % 82;
                const alpha = 0.065 * (1 - ((time * 8) % 82) / 82);
                context.beginPath();
                context.arc(originX, originY, radius, Math.PI * 1.08, Math.PI * 1.92);
                context.strokeStyle = `rgba(46,196,182,${alpha})`;
                context.lineWidth = 1;
                context.stroke();
            }

            particles.forEach((particle) => {
                const progress = (particle.phase + time * particle.speed) % 1;
                const x = width * (0.36 + progress * 0.68);
                const y = height * (0.1 + particle.lane * 0.8) - progress * 34;
                const glow = 0.16 * Math.sin(Math.PI * progress);
                context.beginPath();
                context.arc(x, y, particle.size, 0, Math.PI * 2);
                context.fillStyle = `rgba(104,229,220,${Math.max(0.025, glow)})`;
                context.fill();
            });

            this.animationFrame = window.requestAnimationFrame(draw);
        };

        resize();
        this.resizeObserver = new ResizeObserver(resize);
        this.resizeObserver.observe(hero);
        this.animationFrame = window.requestAnimationFrame(draw);
    }

    disconnectedCallback() {
        if (this.animationFrame) window.cancelAnimationFrame(this.animationFrame);
        if (this.resizeObserver) this.resizeObserver.disconnect();
        this.flowStarted = false;
    }
}
