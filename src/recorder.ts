import ac from '@/audio-context'

recordingChunks: Blob[] = []
mediaRecorder: MediaRecorder | undefined
stopTimeout: NodeJS.Timeout | undefined
playtimeInterval: NodeJS.Timeout | undefined // replace with requestAnimationFrame to avoid lags

playbackDelay = 0.005

ac: AudioContext = ac
