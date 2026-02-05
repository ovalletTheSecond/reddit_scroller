{
  "targets": [
    {
      "target_name": "windows_input",
      "sources": [ "native/windows_input.c" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "conditions": [
        ["OS=='win'", {
          "libraries": [ "user32.lib" ]
        }]
      ]
    }
  ]
}
