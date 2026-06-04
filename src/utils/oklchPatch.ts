/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Math and conversion formulas for Oklch to standard sRGB
function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
  if (isNaN(l)) l = 0;
  if (isNaN(c)) c = 0;
  if (isNaN(h)) h = 0;

  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const L = Math.pow(Math.max(0, l_), 3);
  const M = Math.pow(Math.max(0, m_), 3);
  const S = Math.pow(Math.max(0, s_), 3);

  let r = +4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S;
  let g = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
  let bVal = -0.0041960863 * L - 0.7034186147 * M + 1.7076147010 * S;

  const transfer = (v: number) => {
    return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055;
  };

  r = Math.round(Math.min(255, Math.max(0, transfer(r) * 255)));
  g = Math.round(Math.min(255, Math.max(0, transfer(g) * 255)));
  bVal = Math.round(Math.min(255, Math.max(0, transfer(bVal) * 255)));

  return [r, g, bVal];
}

// Math and conversion formulas for Oklab to standard sRGB
function oklabToRgb(l: number, a: number, b: number): [number, number, number] {
  if (isNaN(l)) l = 0;
  if (isNaN(a)) a = 0;
  if (isNaN(b)) b = 0;

  const l_ = l + 0.3963377774 * a + 0.2115423604 * b;
  const m_ = l - 0.1055613458 * a - 0.0637061730 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const L = Math.pow(Math.max(0, l_), 3);
  const M = Math.pow(Math.max(0, m_), 3);
  const S = Math.pow(Math.max(0, s_), 3);

  let r = +4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S;
  let g = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
  let bVal = -0.0041960863 * L - 0.7034186147 * M + 1.7076147010 * S;

  const transfer = (v: number) => {
    return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055;
  };

  r = Math.round(Math.min(255, Math.max(0, transfer(r) * 255)));
  g = Math.round(Math.min(255, Math.max(0, transfer(g) * 255)));
  bVal = Math.round(Math.min(255, Math.max(0, transfer(bVal) * 255)));

  return [r, g, bVal];
}

function convertSingleOklchStringToRgb(inside: string): string {
  try {
    let mainColor = inside;
    let alphaPart: string | null = null;
    
    if (inside.includes('/')) {
      const parts = inside.split('/');
      mainColor = parts[0].trim();
      alphaPart = parts[1].trim();
    }
    
    // Check if mainColor variables cannot be parsed at runtime
    if (mainColor.includes('var(')) {
      return 'rgb(16, 185, 129)'; // default to a safe primary color
    }
    
    const params = mainColor.trim().split(/[\s,]+/);
    if (params.length < 3) {
      return 'rgb(16, 185, 129)';
    }
    
    const lStr = params[0];
    const cStr = params[1];
    const hStr = params[2];
    
    let l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
    let c = parseFloat(cStr);
    let h = parseFloat(hStr);
    
    if (isNaN(l) || isNaN(c) || isNaN(h)) {
      return 'rgb(16, 185, 129)';
    }
    
    const [r, g, bVal] = oklchToRgb(l, c, h);
    
    if (alphaPart) {
      if (alphaPart.includes('var(')) {
        return `rgb(${r}, ${g}, ${bVal})`;
      }
      let a = alphaPart.endsWith('%') ? parseFloat(alphaPart) / 100 : parseFloat(alphaPart);
      if (isNaN(a)) {
        return `rgb(${r}, ${g}, ${bVal})`;
      }
      return `rgba(${r}, ${g}, ${bVal}, ${a})`;
    }
    
    return `rgb(${r}, ${g}, ${bVal})`;
  } catch (err) {
    console.warn('Error parsing oklch inside:', inside, err);
    return 'rgb(16, 185, 129)';
  }
}

function convertSingleOklabStringToRgb(inside: string): string {
  try {
    let mainColor = inside;
    let alphaPart: string | null = null;
    
    if (inside.includes('/')) {
      const parts = inside.split('/');
      mainColor = parts[0].trim();
      alphaPart = parts[1].trim();
    }
    
    // Check if mainColor variables cannot be parsed at runtime
    if (mainColor.includes('var(')) {
      return 'rgb(16, 185, 129)'; // default to a safe primary color
    }
    
    const params = mainColor.trim().split(/[\s,]+/);
    if (params.length < 3) {
      return 'rgb(16, 185, 129)';
    }
    
    const lStr = params[0];
    const aStr = params[1];
    const bStr = params[2];
    
    let l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
    let aVal = parseFloat(aStr);
    let bValCoord = parseFloat(bStr);
    
    if (isNaN(l) || isNaN(aVal) || isNaN(bValCoord)) {
      return 'rgb(16, 185, 129)';
    }
    
    const [r, g, bVal] = oklabToRgb(l, aVal, bValCoord);
    
    if (alphaPart) {
      if (alphaPart.includes('var(')) {
        return `rgb(${r}, ${g}, ${bVal})`;
      }
      let a = alphaPart.endsWith('%') ? parseFloat(alphaPart) / 100 : parseFloat(alphaPart);
      if (isNaN(a)) {
        return `rgb(${r}, ${g}, ${bVal})`;
      }
      return `rgba(${r}, ${g}, ${bVal}, ${a})`;
    }
    
    return `rgb(${r}, ${g}, ${bVal})`;
  } catch (err) {
    console.warn('Error parsing oklab inside:', inside, err);
    return 'rgb(16, 185, 129)';
  }
}

export function replaceOklchBlocks(cssText: string): string {
  if (!cssText || typeof cssText !== 'string') return cssText;
  
  let result = '';
  let i = 0;
  const len = cssText.length;
  
  while (i < len) {
    if (i + 6 < len && cssText.substring(i, i + 6).toLowerCase() === 'oklch(') {
      let parenCount = 1;
      let start = i + 6;
      let j = start;
      while (j < len && parenCount > 0) {
        if (cssText[j] === '(') {
          parenCount++;
        } else if (cssText[j] === ')') {
          parenCount--;
        }
        j++;
      }
      const inside = cssText.substring(start, j - 1);
      const replacement = convertSingleOklchStringToRgb(inside);
      result += replacement;
      i = j;
    } else if (i + 6 < len && cssText.substring(i, i + 6).toLowerCase() === 'oklab(') {
      let parenCount = 1;
      let start = i + 6;
      let j = start;
      while (j < len && parenCount > 0) {
        if (cssText[j] === '(') {
          parenCount++;
        } else if (cssText[j] === ')') {
          parenCount--;
        }
        j++;
      }
      const inside = cssText.substring(start, j - 1);
      const replacement = convertSingleOklabStringToRgb(inside);
      result += replacement;
      i = j;
    } else {
      result += cssText[i];
      i++;
    }
  }
  return result;
}

export function sanitizeExistingStyleSheets() {
  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (!rules) continue;
        for (let j = rules.length - 1; j >= 0; j--) {
          const rule = rules[j];
          if (rule && rule.cssText && (rule.cssText.includes('oklch') || rule.cssText.includes('oklab'))) {
            const ruleText = rule.cssText;
            const sanitizedText = replaceOklchBlocks(ruleText);
            try {
              sheet.deleteRule(j);
              sheet.insertRule(sanitizedText, j);
            } catch (e) {
              console.warn("Error inserting sanitized rule, deleting rule to prevent html2canvas crash:", e);
              try {
                sheet.deleteRule(j);
              } catch (delErr) {
                console.error("Failed to delete rule:", delErr);
              }
            }
          }
        }
      } catch (err) {
        // Safe to ignore CORS-protected sheets
      }
    }
  } catch (globalErr) {
    console.error("Global oklch stylesheets sanitization failed:", globalErr);
  }
}

export function sanitizeAllInlineStyles(root: HTMLElement = document.body) {
  try {
    const elements = root.querySelectorAll('[style]');
    elements.forEach((el) => {
      const styleAttr = el.getAttribute('style');
      if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
        el.setAttribute('style', replaceOklchBlocks(styleAttr));
      }
    });
  } catch (err) {
    console.error("Error sanitizing inline styles:", err);
  }
}

// Global bootstrap initializer
export function applyGlobalOklchPatch() {
  if (typeof window === 'undefined') return;

  // 1. Intercept CSSStyleSheet.insertRule
  if (typeof CSSStyleSheet !== 'undefined' && CSSStyleSheet.prototype.insertRule) {
    const originalInsertRule = CSSStyleSheet.prototype.insertRule;
    CSSStyleSheet.prototype.insertRule = function (rule: string, index?: number) {
      let finalRule = rule;
      if (typeof rule === 'string' && (rule.includes('oklch') || rule.includes('oklab'))) {
        finalRule = replaceOklchBlocks(rule);
      }
      return originalInsertRule.call(this, finalRule, index);
    };
  }

  // 2. Intercept CSSGroupingRule.insertRule
  if (typeof CSSGroupingRule !== 'undefined' && CSSGroupingRule.prototype.insertRule) {
    const originalGroupInsertRule = CSSGroupingRule.prototype.insertRule;
    CSSGroupingRule.prototype.insertRule = function (rule: string, index?: number) {
      let finalRule = rule;
      if (typeof rule === 'string' && (rule.includes('oklch') || rule.includes('oklab'))) {
        finalRule = replaceOklchBlocks(rule);
      }
      return originalGroupInsertRule.call(this, finalRule, index);
    };
  }

  // 3. Intercept CSSRule.prototype.cssText
  try {
    if (typeof CSSRule !== 'undefined' && CSSRule.prototype) {
      const desc = Object.getOwnPropertyDescriptor(CSSRule.prototype, 'cssText');
      if (desc && desc.get && desc.configurable) {
        const originalGet = desc.get;
        Object.defineProperty(CSSRule.prototype, 'cssText', {
          ...desc,
          get() {
            const val = originalGet.call(this);
            if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
              return replaceOklchBlocks(val);
            }
            return val;
          }
        });
      }
    }
  } catch (e) {
    console.warn('Failed to patch CSSRule.prototype.cssText:', e);
  }

  // 4. Intercept CSSStyleDeclaration.prototype.cssText
  try {
    if (typeof CSSStyleDeclaration !== 'undefined' && CSSStyleDeclaration.prototype) {
      const desc = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'cssText');
      if (desc && desc.get && desc.configurable) {
        const originalGet = desc.get;
        Object.defineProperty(CSSStyleDeclaration.prototype, 'cssText', {
          ...desc,
          get() {
            const val = originalGet.call(this);
            if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
              return replaceOklchBlocks(val);
            }
            return val;
          }
        });
      }
    }
  } catch (e) {
    console.warn('Failed to patch CSSStyleDeclaration.prototype.cssText:', e);
  }

  // 5. Intercept CSSStyleDeclaration.prototype.getPropertyValue
  try {
    if (typeof CSSStyleDeclaration !== 'undefined' && CSSStyleDeclaration.prototype && CSSStyleDeclaration.prototype.getPropertyValue) {
      const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
      CSSStyleDeclaration.prototype.getPropertyValue = function (property: string) {
        const val = originalGetPropertyValue.call(this, property);
        if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
          return replaceOklchBlocks(val);
        }
        return val;
      };
    }
  } catch (e) {
    console.warn('Failed to patch CSSStyleDeclaration.prototype.getPropertyValue:', e);
  }

  // 6. Overwrite window.getComputedStyle
  try {
    if (typeof window !== 'undefined' && window.getComputedStyle) {
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
        const style = originalGetComputedStyle(elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            const val = (target as any)[prop];
            if (prop === 'getPropertyValue') {
              return function (propertyName: string) {
                const raw = target.getPropertyValue(propertyName);
                if (typeof raw === 'string' && (raw.includes('oklch') || raw.includes('oklab'))) {
                  return replaceOklchBlocks(raw);
                }
                return raw;
              };
            }
            if (typeof val === 'function') {
              return val.bind(target);
            }
            if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
              return replaceOklchBlocks(val);
            }
            return val;
          }
        });
      };
    }
  } catch (e) {
    console.warn('Failed to patch window.getComputedStyle:', e);
  }

  // 7. Scan style tags as they are added or already loaded
  window.addEventListener('DOMContentLoaded', () => {
    sanitizeExistingStyleSheets();
  });
  
  // Also run immediately if DOM is already parsed
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    sanitizeExistingStyleSheets();
  }
}
