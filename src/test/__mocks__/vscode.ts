export const window = {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    activeTextEditor: {
        document: {
            uri: {
                fsPath: "/mock/path/file.ts",
            },
        },
    },
};

export const workspace = {
    workspaceFolders: [{ uri: { fsPath: "/mock/project" } }],
    getWorkspaceFolder: jest.fn(() => ({ uri: { fsPath: "/mock/project" } })),
};
