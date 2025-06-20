export enum EStatus {
    INITIAL_REVIEW = 'INITIAL_REVIEW',
    TRANSLATION = 'TRANSLATION',
    CAPTIONING = 'CAPTIONING',
    APPROVAL = 'APPROVAL',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

export enum ETYPE {
    VIDEO = 'VIDEO',
    TEXT = 'TEXT'
}

export enum ERejectionReasons {
    WRONG_TITLE_TRANSITION = 'Wrong title transition',
    WRONG_VIDEO_UPLOAD = 'Wrong video upload',
    VIDEO_GLITCH = 'Video glitch',
    GRAMMAR_ERROR = 'Grammar error',
    WRONG_END_BOARD = 'Wrong end board',
    PROMOTION_SPOTTED = 'Promotion spotted',
    BROKEN_THUMBNAIL = 'Broken thumbnail',
    VIDEO_NOT_PLAYING = 'Video not playing',
    SUBTITLE_MISSING = 'Subtitle missing',
    WRONG_META_DATA = 'Wrong meta data',
    OTHER = 'Other',
}