// Web-compatible mock for React Native legacySendAccessibilityEvent
// This module handles accessibility events that don't exist on web

export default function legacySendAccessibilityEvent() {
  // No-op on web - accessibility events are handled differently
  return;
}

export const sendAccessibilityEvent = () => {};
export const AccessibilityEventTypes = {
  typeViewFocused: 'focus',
  typeViewClicked: 'click',
  typeViewSelected: 'select',
  typeViewTextChanged: 'textChanged',
  typeWindowStateChanged: 'windowStateChanged',
};