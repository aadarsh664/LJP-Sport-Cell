export const AUDIO_MAPPING = {
    login: '/audio/login.mp3',
    dashboard: '/audio/dashboard_tour.mp3',
    directory: '/audio/directory_tour.mp3',
    meetings: '/audio/meetings_tour.mp3',
    profile: '/audio/profile_tour.mp3',
    signup: '/audio/signup.mp3',
    welcome: '/audio/welcome.mp3'
};

class AudioService {
    private audio: HTMLAudioElement | null = null;
    private isMuted: boolean = false;

    setMute(muted: boolean) {
        this.isMuted = muted;
        if (this.audio) {
            this.audio.muted = muted;
        }
    }

    play(key: keyof typeof AUDIO_MAPPING, isMutedOverride?: boolean) {
        const muted = isMutedOverride !== undefined ? isMutedOverride : this.isMuted;
        if (muted) return;

        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }

        this.audio = new Audio(AUDIO_MAPPING[key]);
        this.audio.muted = this.isMuted;
        this.audio.play().catch(err => console.warn("Audio play blocked:", err));
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
    }
}

export const audioService = new AudioService();
