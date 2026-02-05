/**
 * Windows Input Native Addon - Pure C Implementation
 * Direct Windows API calls for keyboard and mouse simulation
 * 
 * This module provides native bindings to Windows user32.dll functions:
 * - keybd_event: Synthesize keyboard events
 * - mouse_event: Synthesize mouse events
 * - SetCursorPos: Move mouse cursor
 */

#include <node_api.h>
#include <stdlib.h>

#ifdef _WIN32
#include <windows.h>
#endif

/**
 * Press a key (down and up)
 */
static napi_value PressKey(napi_env env, napi_callback_info info) {
  napi_status status;
  size_t argc = 1;
  napi_value args[1];
  napi_value result;

  status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "Failed to parse arguments");
    return NULL;
  }

  if (argc < 1) {
    napi_throw_type_error(env, NULL, "Wrong number of arguments");
    return NULL;
  }

#ifdef _WIN32
  int32_t vk;
  status = napi_get_value_int32(env, args[0], &vk);
  if (status != napi_ok) {
    napi_throw_type_error(env, NULL, "Invalid key code");
    return NULL;
  }

  /* Key down */
  keybd_event((BYTE)vk, 0, 0, 0);
  Sleep(50);
  /* Key up */
  keybd_event((BYTE)vk, 0, KEYEVENTF_KEYUP, 0);

  napi_get_boolean(env, 1, &result);
  return result;
#else
  napi_throw_error(env, NULL, "Only supported on Windows");
  return NULL;
#endif
}

/**
 * Press key down (hold)
 */
static napi_value KeyDown(napi_env env, napi_callback_info info) {
  napi_status status;
  size_t argc = 1;
  napi_value args[1];
  napi_value result;

  status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "Failed to parse arguments");
    return NULL;
  }

  if (argc < 1) {
    napi_throw_type_error(env, NULL, "Wrong number of arguments");
    return NULL;
  }

#ifdef _WIN32
  int32_t vk;
  status = napi_get_value_int32(env, args[0], &vk);
  if (status != napi_ok) {
    napi_throw_type_error(env, NULL, "Invalid key code");
    return NULL;
  }

  keybd_event((BYTE)vk, 0, 0, 0);

  napi_get_boolean(env, 1, &result);
  return result;
#else
  napi_throw_error(env, NULL, "Only supported on Windows");
  return NULL;
#endif
}

/**
 * Release key (up)
 */
static napi_value KeyUp(napi_env env, napi_callback_info info) {
  napi_status status;
  size_t argc = 1;
  napi_value args[1];
  napi_value result;

  status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "Failed to parse arguments");
    return NULL;
  }

  if (argc < 1) {
    napi_throw_type_error(env, NULL, "Wrong number of arguments");
    return NULL;
  }

#ifdef _WIN32
  int32_t vk;
  status = napi_get_value_int32(env, args[0], &vk);
  if (status != napi_ok) {
    napi_throw_type_error(env, NULL, "Invalid key code");
    return NULL;
  }

  keybd_event((BYTE)vk, 0, KEYEVENTF_KEYUP, 0);

  napi_get_boolean(env, 1, &result);
  return result;
#else
  napi_throw_error(env, NULL, "Only supported on Windows");
  return NULL;
#endif
}

/**
 * Move mouse cursor to position
 */
static napi_value MoveMouse(napi_env env, napi_callback_info info) {
  napi_status status;
  size_t argc = 2;
  napi_value args[2];
  napi_value result;

  status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "Failed to parse arguments");
    return NULL;
  }

  if (argc < 2) {
    napi_throw_type_error(env, NULL, "Wrong number of arguments - expected x, y");
    return NULL;
  }

#ifdef _WIN32
  int32_t x, y;
  status = napi_get_value_int32(env, args[0], &x);
  if (status != napi_ok) {
    napi_throw_type_error(env, NULL, "Invalid x coordinate");
    return NULL;
  }

  status = napi_get_value_int32(env, args[1], &y);
  if (status != napi_ok) {
    napi_throw_type_error(env, NULL, "Invalid y coordinate");
    return NULL;
  }

  SetCursorPos(x, y);

  napi_get_boolean(env, 1, &result);
  return result;
#else
  napi_throw_error(env, NULL, "Only supported on Windows");
  return NULL;
#endif
}

/**
 * Click mouse at current or specified position
 */
static napi_value ClickMouse(napi_env env, napi_callback_info info) {
  napi_status status;
  size_t argc = 3;
  napi_value args[3];
  napi_value result;

  status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "Failed to parse arguments");
    return NULL;
  }

#ifdef _WIN32
  /* Move mouse if coordinates provided */
  if (argc >= 2) {
    napi_valuetype type0, type1;
    napi_typeof(env, args[0], &type0);
    napi_typeof(env, args[1], &type1);
    
    if (type0 == napi_number && type1 == napi_number) {
      int32_t x, y;
      napi_get_value_int32(env, args[0], &x);
      napi_get_value_int32(env, args[1], &y);
      SetCursorPos(x, y);
      Sleep(50);
    }
  }

  /* Determine button (default: left = 0) */
  int32_t button = 0;
  if (argc >= 3) {
    napi_get_value_int32(env, args[2], &button);
  }

  DWORD downFlag, upFlag;
  switch (button) {
    case 1: /* right */
      downFlag = MOUSEEVENTF_RIGHTDOWN;
      upFlag = MOUSEEVENTF_RIGHTUP;
      break;
    case 2: /* middle */
      downFlag = MOUSEEVENTF_MIDDLEDOWN;
      upFlag = MOUSEEVENTF_MIDDLEUP;
      break;
    default: /* left */
      downFlag = MOUSEEVENTF_LEFTDOWN;
      upFlag = MOUSEEVENTF_LEFTUP;
      break;
  }

  /* Mouse down */
  mouse_event(downFlag, 0, 0, 0, 0);
  Sleep(50);
  /* Mouse up */
  mouse_event(upFlag, 0, 0, 0, 0);

  napi_get_boolean(env, 1, &result);
  return result;
#else
  napi_throw_error(env, NULL, "Only supported on Windows");
  return NULL;
#endif
}

/**
 * Check if running on Windows
 */
static napi_value IsWindows(napi_env env, napi_callback_info info) {
  napi_value result;
#ifdef _WIN32
  napi_get_boolean(env, 1, &result);
#else
  napi_get_boolean(env, 0, &result);
#endif
  return result;
}

/**
 * Initialize the module
 */
static napi_value Init(napi_env env, napi_value exports) {
  napi_status status;
  napi_value fn;

  /* Create and export pressKey function */
  status = napi_create_function(env, NULL, 0, PressKey, NULL, &fn);
  if (status != napi_ok) return NULL;
  status = napi_set_named_property(env, exports, "pressKey", fn);
  if (status != napi_ok) return NULL;

  /* Create and export keyDown function */
  status = napi_create_function(env, NULL, 0, KeyDown, NULL, &fn);
  if (status != napi_ok) return NULL;
  status = napi_set_named_property(env, exports, "keyDown", fn);
  if (status != napi_ok) return NULL;

  /* Create and export keyUp function */
  status = napi_create_function(env, NULL, 0, KeyUp, NULL, &fn);
  if (status != napi_ok) return NULL;
  status = napi_set_named_property(env, exports, "keyUp", fn);
  if (status != napi_ok) return NULL;

  /* Create and export moveMouse function */
  status = napi_create_function(env, NULL, 0, MoveMouse, NULL, &fn);
  if (status != napi_ok) return NULL;
  status = napi_set_named_property(env, exports, "moveMouse", fn);
  if (status != napi_ok) return NULL;

  /* Create and export click function */
  status = napi_create_function(env, NULL, 0, ClickMouse, NULL, &fn);
  if (status != napi_ok) return NULL;
  status = napi_set_named_property(env, exports, "click", fn);
  if (status != napi_ok) return NULL;

  /* Create and export isWindows function */
  status = napi_create_function(env, NULL, 0, IsWindows, NULL, &fn);
  if (status != napi_ok) return NULL;
  status = napi_set_named_property(env, exports, "isWindows", fn);
  if (status != napi_ok) return NULL;

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)

