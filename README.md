# AutoForge

AutoForge generates meaningful commit messages and branch names using either AI-powered analysis or built-in smart generation — depending on your selected provider.

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

## 🚀 Usage

## 🧭 Command Palette

You can access AutoForge commands from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **AutoForge: Auto Commit** - Generate and commit with Custom/AI-generated message
- **AutoForge: Auto Branch** - Create a new branch with Custom/AI-generated name
- **AutoForge: Auto Branch & Commit** - Create a new branch & commit with Custom/AI-generated name & message

### 🎬 Demo — Command Palette

#### Auto Commit

![Auto Commit Workflow](https://raw.githubusercontent.com/salmanakzz/autoforge/main/assets/cp/auto-commit.gif)

#### Auto Branch

![Auto Branch Workflow](https://raw.githubusercontent.com/salmanakzz/autoforge/main/assets/cp/auto-branch.gif)

#### Auto Branch & Commit

![Auto Branch and Commit](https://raw.githubusercontent.com/salmanakzz/autoforge/main/assets/cp/auto-branch-commit.gif)

---

## 🌿 Source Control View (Git Integration)

When working with a Git repository, you'll see AutoForge buttons in the Source Control view:

1. **Auto Commit** button (✨) - Appears in the Source Control title bar and as an inline action
2. **Auto Branch** button (🌿) - Appears in the Source Control title bar and as an inline action
3. **Auto Branch & Commit** button (🚀) - Appears in the Source Control title bar

These buttons are only visible when the Git SCM provider is active.

### 🎬 Demo — Source Control View

#### Auto Commit

![Auto Commit Workflow](https://raw.githubusercontent.com/salmanakzz/autoforge/main/assets/scm/auto-commit.gif)

#### Auto Branch

![Auto Branch Workflow](https://raw.githubusercontent.com/salmanakzz/autoforge/main/assets/scm/auto-branch.gif)

#### Auto Branch & Commit

![Auto Branch and Commit](https://raw.githubusercontent.com/salmanakzz/autoforge/main/assets/scm/auto-branch-commit.gif)

---

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

### Extension Settings

AutoForge supports multiple generation providers depending on your workflow and privacy preference.

### Available Providers

#### 🔹 `custom` (Default — No API Key Required)

- Uses AutoForge's **built-in generation logic**
- Does **not** call any external AI service
- No API key required
- All message and branch generation happens locally using customized functions

This mode is ideal if you prefer:

- ✅ Offline-friendly behavior
- ✅ Faster generation
- ✅ No external data sharing

> Note: In `custom` mode, generated messages are **rule-based**, not AI-generated.

---

#### 🤖 `groq` (AI-Powered)

- Uses an external AI provider to analyze your staged changes
- Generates smarter, context-aware commit messages and branch names
- Requires an API key

This mode is recommended if you want:

- ✅ More intelligent commit summaries
- ✅ Better contextual naming
- ✅ AI-assisted workflows

---

### Settings

This extension contributes the following settings:

- `myExtension.provider`
    - Choose which generation provider to use
    - Options: `custom`, `groq`
    - Default: `custom`

- `myExtension.apiKey`
    - API key for AI providers (required only when using `groq`)
    - Default: `""`

### 📸 Snap

![Settings UI](https://raw.githubusercontent.com/salmanakzz/autoforge/main/assets/settings-ui.png)

---

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

AutoForge respects your workflow and privacy preferences.

- When using **`custom` provider**:
    - No external requests are made
    - All generation happens locally
    - No data leaves your machine

- When using **AI providers (e.g., `groq`)**:
    - Staged git diff data is sent to the configured AI service to generate commit messages
    - No data is stored by AutoForge

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a PR.

## License

MIT

---

**Enjoy automated Git workflows with AutoForge!** 🚀

```

```
