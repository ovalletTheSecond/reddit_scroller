/**
 * Windows Input Test Program - Pure C
 * 
 * Standalone test program for Windows API keyboard and mouse simulation.
 * No Node.js required - just compile and run!
 * 
 * Compile with:
 *   gcc test_windows_input.c -o test_windows_input.exe -luser32
 *   OR
 *   cl test_windows_input.c user32.lib
 */

#include <windows.h>
#include <stdio.h>

/* Function prototypes */
void test_press_key(BYTE vk, const char* key_name);
void test_move_mouse(int x, int y);
void test_click_mouse(int x, int y);
void print_menu(void);
void wait_seconds(int seconds);

int main(void) {
    int choice;
    int x, y;
    char buffer[256];
    
    printf("╔══════════════════════════════════════════════════════╗\n");
    printf("║   Windows Input Test Program - Pure C               ║\n");
    printf("║   Direct Windows API Calls                          ║\n");
    printf("╚══════════════════════════════════════════════════════╝\n\n");
    
    printf("This program demonstrates keyboard and mouse simulation\n");
    printf("using direct Windows API calls in pure C.\n\n");
    
    printf("⚠️  WARNING: This will control your keyboard/mouse!\n");
    printf("    Make sure you're ready before running tests.\n\n");
    
    while (1) {
        print_menu();
        printf("Enter choice: ");
        
        if (fgets(buffer, sizeof(buffer), stdin) == NULL) {
            break;
        }
        
        choice = atoi(buffer);
        
        switch (choice) {
            case 1:
                printf("\n→ Testing keyboard: Press 'Z' key\n");
                printf("  Get ready... (3 seconds)\n");
                wait_seconds(3);
                test_press_key(0x5A, "Z");
                printf("  ✓ Done! You should have seen 'z' typed.\n\n");
                break;
                
            case 2:
                printf("\n→ Testing keyboard: Press 'Enter' key\n");
                printf("  Get ready... (2 seconds)\n");
                wait_seconds(2);
                test_press_key(0x0D, "Enter");
                printf("  ✓ Done! You should have seen Enter pressed.\n\n");
                break;
                
            case 3:
                printf("\n→ Testing mouse: Move to center of screen\n");
                x = GetSystemMetrics(SM_CXSCREEN) / 2;
                y = GetSystemMetrics(SM_CYSCREEN) / 2;
                printf("  Moving to (%d, %d)... (2 seconds)\n", x, y);
                wait_seconds(2);
                test_move_mouse(x, y);
                printf("  ✓ Done! Cursor should be at screen center.\n\n");
                break;
                
            case 4:
                printf("\n→ Testing mouse: Click at current position\n");
                printf("  Position your mouse where you want to click...\n");
                printf("  Clicking in 3 seconds...\n");
                wait_seconds(3);
                /* Get current cursor position */
                POINT pt;
                GetCursorPos(&pt);
                test_click_mouse(pt.x, pt.y);
                printf("  ✓ Done! Click performed at (%ld, %ld).\n\n", pt.x, pt.y);
                break;
                
            case 5:
                printf("\n→ Testing mouse: Click at (100, 100)\n");
                printf("  Moving and clicking in 2 seconds...\n");
                wait_seconds(2);
                test_click_mouse(100, 100);
                printf("  ✓ Done! Click performed at (100, 100).\n\n");
                break;
                
            case 6:
                printf("\n→ Full demo: Press 'z' then click\n");
                printf("  Starting in 3 seconds...\n");
                wait_seconds(3);
                
                printf("  1. Pressing 'z' key...\n");
                test_press_key(0x5A, "Z");
                wait_seconds(1);
                
                printf("  2. Moving mouse to (200, 200)...\n");
                test_move_mouse(200, 200);
                wait_seconds(1);
                
                printf("  3. Clicking mouse...\n");
                test_click_mouse(200, 200);
                
                printf("  ✓ Full demo complete!\n\n");
                break;
                
            case 0:
                printf("\nExiting...\n");
                return 0;
                
            default:
                printf("\nInvalid choice! Please try again.\n\n");
        }
    }
    
    return 0;
}

/**
 * Print the menu
 */
void print_menu(void) {
    printf("═══════════════════════════════════════════════════════\n");
    printf("TEST MENU:\n");
    printf("═══════════════════════════════════════════════════════\n");
    printf("  1. Press 'Z' key\n");
    printf("  2. Press 'Enter' key\n");
    printf("  3. Move mouse to screen center\n");
    printf("  4. Click at current mouse position\n");
    printf("  5. Click at (100, 100)\n");
    printf("  6. Full demo (press z + move + click)\n");
    printf("  0. Exit\n");
    printf("═══════════════════════════════════════════════════════\n");
}

/**
 * Test pressing a key
 */
void test_press_key(BYTE vk, const char* key_name) {
    printf("  → Pressing virtual key 0x%02X (%s)...\n", vk, key_name);
    
    /* Key down */
    keybd_event(vk, 0, 0, 0);
    printf("    - Key down sent\n");
    Sleep(50);
    
    /* Key up */
    keybd_event(vk, 0, KEYEVENTF_KEYUP, 0);
    printf("    - Key up sent\n");
    
    printf("  ✓ Key press complete\n");
}

/**
 * Test moving mouse
 */
void test_move_mouse(int x, int y) {
    printf("  → Moving cursor to (%d, %d)...\n", x, y);
    
    BOOL result = SetCursorPos(x, y);
    
    if (result) {
        printf("  ✓ Cursor moved successfully\n");
        
        /* Verify position */
        POINT pt;
        GetCursorPos(&pt);
        printf("    Current position: (%ld, %ld)\n", pt.x, pt.y);
    } else {
        printf("  ✗ Failed to move cursor!\n");
    }
}

/**
 * Test clicking mouse
 */
void test_click_mouse(int x, int y) {
    printf("  → Clicking at (%d, %d)...\n", x, y);
    
    /* Move to position first */
    SetCursorPos(x, y);
    Sleep(50);
    
    /* Mouse down */
    mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
    printf("    - Mouse down sent\n");
    Sleep(50);
    
    /* Mouse up */
    mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
    printf("    - Mouse up sent\n");
    
    printf("  ✓ Click complete\n");
}

/**
 * Wait for specified seconds with countdown
 */
void wait_seconds(int seconds) {
    for (int i = seconds; i > 0; i--) {
        printf("  %d...\n", i);
        Sleep(1000);
    }
}
