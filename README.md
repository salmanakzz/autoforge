# AutoForge

AutoForge is a VS Code extension that uses AI to automatically generate meaningful commit messages and branch names based on your code changes. It streamlines your Git workflow by eliminating the need to manually write commit messages and branch names.

## Features

### 🤖 AI-Powered Commit Messages

Automatically generate commit messages by analyzing your staged changes. The extension uses AI to understand your code changes and suggests appropriate commit messages.

### 🌿 AI-Powered Branch Names

Create new branches with AI-generated names that reflect the purpose of your changes. No more thinking about branch naming conventions!

### 🔄 Source Control Integration

Seamlessly integrated with VS Code's Source Control view, similar to GitHub Copilot's "Generate Commit" feature. Access auto-commit and auto-branch functionality directly from the Source Control panel.

### ⚡ Quick Actions

- **Auto Commit**: Generate and commit with an AI-generated message
- **Auto Branch**: Create a new branch with an AI-generated name
- **Auto Branch & Commit**: Create a branch and commit in one action

## Usage

### Command Palette

You can access AutoForge commands from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **AutoForge: Auto Commit** - Generate and commit with an AI-generated message
- **AutoForge: Auto Branch** - Create a new branch with an AI-generated name

### Source Control View

When working with a Git repository, you'll see AutoForge buttons in the Source Control view:

1. **Auto Commit** button (✨) - Appears in the Source Control title bar and as an inline action
2. **Auto Branch** button (🌿) - Appears in the Source Control title bar and as an inline action
3. **Auto Branch & Commit** button (🚀) - Appears in the Source Control title bar

These buttons are only visible when the Git SCM provider is active.

### Workflow

1. **For Auto Commit:**
    - Stage your changes using Git
    - Click the "Auto Commit" button in the Source Control view, or use the Command Palette
    - Review and edit the AI-generated commit message if needed
    - Confirm to commit

2. **For Auto Branch:**
    - Click the "Auto Branch" button in the Source Control view, or use the Command Palette
    - Review and edit the AI-generated branch name if needed
    - Confirm to create and checkout the new branch

3. **For Auto Branch & Commit:**
    - Stage your changes using Git
    - Click the "Auto Branch & Commit" button in the Source Control view
    - First, a new branch will be created with an AI-generated name
    - Then, your changes will be committed with an AI-generated message

## Extension Settings

This extension contributes the following settings:

- `myExtension.provider`: Choose which AI provider to use
    - Options: `custom`, `groq`
    - Default: `custom`

- `myExtension.apiKey`: API Key for the selected provider
    - Default: `""`
    - **Note**: You need to configure your API key before using the extension

## Requirements

- VS Code version 1.106.0 or higher
- A Git repository initialized in your workspace
- An API key for the selected AI provider (configured in settings)

## Configuration

1. Open VS Code Settings (`Ctrl+,` / `Cmd+,`)
2. Search for "AutoForge" or navigate to the extension settings
3. Configure your AI provider and API key:
    - Set `myExtension.provider` to your preferred provider (`custom` or `groq`)
    - Set `myExtension.apiKey` to your API key

## Known Issues

None at the moment. If you encounter any issues, please report them on the extension's GitHub repository.

## Release Notes

### 0.0.1

Initial release of AutoForge with the following features:

- ✅ AI-powered commit message generation
- ✅ AI-powered branch name generation
- ✅ Command Palette integration
- ✅ Source Control view integration
- ✅ Auto Branch & Commit combined action
- ✅ Support for multiple AI providers (Custom, Groq)

---

## Privacy

AutoForge sends staged git diff data to the AI service to generate commit messages. No data is stored.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

---

**Enjoy automated Git workflows with AutoForge!** 🚀

```

```
