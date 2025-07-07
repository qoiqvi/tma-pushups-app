import { 
  init as initTMA,
  postEvent,
  initData,
  backButton,
  viewport,
  themeParams,
  mainButton,
  secondaryButton,
  settingsButton,
  invoiceClosed,
  popupClosed,
  qrTextReceived,
  clipboardTextReceived,
  writeAccessRequested,
  contactRequested,
  closingBehavior,
  openLink,
  openTelegramLink,
  shareURL,
  readTextFromClipboard,
  shareStory
} from '@telegram-apps/sdk-react';

/**
 * Initializes the Telegram Mini App SDK
 */
export async function initTelegramSDK(): Promise<void> {
  // Enable debug mode for development
  if (process.env.NODE_ENV === 'development') {
    console.log('[TMA] Initializing Telegram SDK in development mode');
  }

  try {
    // Initialize SDK components
    initTMA();

    // Initialize data
    initData.restore();

    // Initialize UI components
    void backButton.mount();
    void viewport.mount();
    void themeParams.mount();
    void mainButton.mount();
    void secondaryButton.mount();
    void settingsButton.mount();

    // Initialize other features
    void closingBehavior.mount();

    // Initialize event handlers
    void invoiceClosed.mount();
    void popupClosed.mount();
    void qrTextReceived.mount();
    void clipboardTextReceived.mount();
    void writeAccessRequested.mount();
    void contactRequested.mount();

    // Apply theme CSS variables
    if (themeParams.isMounted()) {
      themeParams.bindCssVars();
    }

    // Apply viewport CSS variables  
    if (viewport.isMounted() && viewport.isCssVarsBound()) {
      viewport.bindCssVars();
    }

    // Expand viewport
    if (viewport.isMounted()) {
      viewport.expand();
    }

    // Signal that the app is ready
    postEvent('web_app_ready');

    if (process.env.NODE_ENV === 'development') {
      console.log('[TMA] Telegram SDK initialized successfully');
      console.log('[TMA] Init data:', initData.state);
    }
  } catch (error) {
    console.error('[TMA] Failed to initialize Telegram SDK:', error);
    throw error;
  }
}

/**
 * Checks if the app is running in Telegram
 */
export function isTelegramEnvironment(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

/**
 * Gets the raw init data string for server validation
 */
export function getRawInitData(): string | null {
  if (!initData.state) return null;
  
  // Try to get from URL hash first (most reliable)
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const tgWebAppData = params.get('tgWebAppData');
    if (tgWebAppData) {
      return tgWebAppData;
    }
  }

  // Try sessionStorage as fallback
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('__telegram__initData');
    if (stored) {
      return stored;
    }
  }

  // If we have initData state but no raw string, we need to reconstruct it
  // This is less reliable but better than nothing
  const data = initData.state;
  const params = new URLSearchParams();
  
  if (data.user) {
    params.append('user', JSON.stringify(data.user));
  }
  if (data.authDate) {
    params.append('auth_date', data.authDate.getTime().toString());
  }
  if (data.hash) {
    params.append('hash', data.hash);
  }
  if (data.queryId) {
    params.append('query_id', data.queryId);
  }
  if (data.chatType) {
    params.append('chat_type', data.chatType);
  }
  if (data.chatInstance) {
    params.append('chat_instance', data.chatInstance);
  }
  if (data.startParam) {
    params.append('start_param', data.startParam);
  }

  return params.toString();
}

/**
 * Gets the current user from init data
 */
export function getTelegramUser() {
  return initData.user();
}

/**
 * Mock environment for development
 */
export function mockTelegramEnvironment() {
  if (typeof window === 'undefined') return;

  const mockUser = {
    id: 99281932,
    first_name: 'Andrew',
    last_name: 'Rogue',
    username: 'rogue',
    language_code: 'en',
    is_premium: true,
    allows_write_to_pm: true,
  };

  const mockInitData = {
    user: mockUser,
    auth_date: new Date(),
    hash: 'mock-hash-development',
    query_id: 'mock-query-id',
  };

  // Create mock WebApp object
  if (!window.Telegram) {
    (window as any).Telegram = {};
  }
  
  if (!window.Telegram.WebApp) {
    (window as any).Telegram.WebApp = {
      initData: '',
      initDataUnsafe: {
        user: mockUser,
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'mock-hash-development',
      },
      ready: () => {},
      expand: () => {},
      close: () => {},
      MainButton: {
        show: () => {},
        hide: () => {},
        setText: () => {},
        onClick: () => {},
        offClick: () => {},
      },
      BackButton: {
        show: () => {},
        hide: () => {},
        onClick: () => {},
        offClick: () => {},
      },
      version: '7.0',
      platform: 'web',
      colorScheme: 'light',
      themeParams: {
        bg_color: '#ffffff',
        text_color: '#000000',
        hint_color: '#999999',
        link_color: '#2481cc',
        button_color: '#5288c1',
        button_text_color: '#ffffff',
      },
    };
  }

  // Mock the init data in URL
  const params = new URLSearchParams();
  params.append('user', JSON.stringify(mockUser));
  params.append('auth_date', Math.floor(Date.now() / 1000).toString());
  params.append('hash', 'mock-hash-development');
  
  window.location.hash = `tgWebAppData=${encodeURIComponent(params.toString())}`;
  
  // Store in sessionStorage as well
  sessionStorage.setItem('__telegram__initData', params.toString());
  
  console.log('[TMA] Mock Telegram environment created');
}