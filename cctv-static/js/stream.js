/**
 * Client Streaming Engine Controllers.
 * Wraps Hls.js initialization handlers and automatic heartbeat/reconnect listeners.
 */

export function checkHlsSupport() {
  return typeof Hls !== 'undefined' && Hls.isSupported();
}

export function autoReconnectStream(videoElement, streamUrl, retryLimit = 5, onFallback) {
  let attempts = 0;
  
  const attemptLoading = () => {
    if (attempts >= retryLimit) {
      if (onFallback) onFallback();
      return;
    }
    
    attempts++;
    console.warn(`Connecting stream pipe... Trial ${attempts}/${retryLimit}`);
    
    setTimeout(() => {
      videoElement.src = streamUrl;
      videoElement.load();
    }, 4000);
  };
  
  videoElement.addEventListener('error', attemptLoading);
}
