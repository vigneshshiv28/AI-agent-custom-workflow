import { ToolLoopAgent, tool, isStepCount, isLoopFinished } from "ai";
import { z } from "zod";
import { drive_v3 } from "googleapis";
import { getModel } from "../../model";

export function createGoogleDriveAgent(drive: drive_v3.Drive) {
  return new ToolLoopAgent({
    model: getModel(),
    stopWhen: [
      isLoopFinished(),
      isStepCount(6),
    ],

    instructions: `You are a Google Drive agent. Use the available tools to fulfill the user's request.
    
    EXECUTION RULES:
    - Never ask for confirmation, never pause, never say "should I proceed?"
    - If the task is clear → act immediately
    - Use the WORKSPACE_SNAPSHOT in your prompt to find IDs of existing files and folders without searching.
    - If a file or folder is not in the snapshot, use 'searchFiles' to find it.
    
    TOOL USAGE RULES:
    - Folders use the mimeType 'application/vnd.google-apps.folder'.
    - Google Docs use 'application/vnd.google-apps.document'.
    - Google Sheets use 'application/vnd.google-apps.spreadsheet'.
    - When moving files, you must get the file's current parents first (using getFileMetadata) and remove them when adding the new parent.
    
    OUTPUT:
    - Always report: what action was taken and any relevant names/IDs.
    - If action failed, explain why.`,

    tools: {
      searchFiles: tool({
        description: "Search for files and folders by query.",
        inputSchema: z.object({
          query: z.string().describe("Google Drive search query (e.g. \"name contains 'Project'\" or \"mimeType='application/vnd.google-apps.folder'\")."),
        }),
        execute: async ({ query }) => {
          try {
            const response = await drive.files.list({
              q: query,
              fields: 'files(id, name, mimeType, parents, webViewLink)',
              pageSize: 20,
            });
            return { files: response.data.files || [] };
          } catch (error) {
            console.error("Error in searchFiles tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      getFileMetadata: tool({
        description: "Get detailed metadata of a specific file or folder by ID.",
        inputSchema: z.object({
          fileId: z.string().describe("The ID of the file or folder."),
        }),
        execute: async ({ fileId }) => {
          try {
            const response = await drive.files.get({
              fileId,
              fields: 'id, name, mimeType, parents, modifiedTime, webViewLink, size, trashed',
            });
            return response.data;
          } catch (error) {
            console.error("Error in getFileMetadata tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      createFile: tool({
        description: "Create a new Google Doc, Sheet, or Slide.",
        inputSchema: z.object({
          name: z.string().describe("Name of the new file."),
          mimeType: z.string().describe("MIME type (e.g. 'application/vnd.google-apps.document' or 'application/vnd.google-apps.spreadsheet')."),
          parentFolderId: z.string().optional().describe("Optional ID of the folder to create this file inside."),
        }),
        execute: async ({ name, mimeType, parentFolderId }) => {
          try {
            const requestBody: any = { name, mimeType };
            if (parentFolderId) {
              requestBody.parents = [parentFolderId];
            }
            const response = await drive.files.create({
              requestBody,
              fields: 'id, name, webViewLink',
            });
            return response.data;
          } catch (error) {
            console.error("Error in createFile tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      uploadFile: tool({
        description: "Upload a new file with text content.",
        inputSchema: z.object({
          name: z.string().describe("Name of the file (including extension if applicable)."),
          content: z.string().describe("The text content of the file."),
          mimeType: z.string().describe("MIME type of the content (e.g. 'text/plain', 'text/html', 'text/csv')."),
          parentFolderId: z.string().optional().describe("Optional ID of the folder to create this file inside."),
        }),
        execute: async ({ name, content, mimeType, parentFolderId }) => {
          try {
            const requestBody: any = { name };
            if (parentFolderId) {
              requestBody.parents = [parentFolderId];
            }
            const response = await drive.files.create({
              requestBody,
              media: {
                mimeType,
                body: content,
              },
              fields: 'id, name, webViewLink',
            });
            return response.data;
          } catch (error) {
            console.error("Error in uploadFile tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      createFolder: tool({
        description: "Create a new folder in the root directory.",
        inputSchema: z.object({
          name: z.string().describe("Name of the folder."),
        }),
        execute: async ({ name }) => {
          try {
            const response = await drive.files.create({
              requestBody: {
                name,
                mimeType: 'application/vnd.google-apps.folder',
              },
              fields: 'id, name, webViewLink',
            });
            return response.data;
          } catch (error) {
            console.error("Error in createFolder tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      createFolderInParent: tool({
        description: "Create a new folder inside a specific parent folder.",
        inputSchema: z.object({
          name: z.string().describe("Name of the folder."),
          parentFolderId: z.string().describe("The ID of the parent folder."),
        }),
        execute: async ({ name, parentFolderId }) => {
          try {
            const response = await drive.files.create({
              requestBody: {
                name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentFolderId],
              },
              fields: 'id, name, webViewLink',
            });
            return response.data;
          } catch (error) {
            console.error("Error in createFolderInParent tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      moveFileToFolder: tool({
        description: "Move a file or folder into a new parent folder.",
        inputSchema: z.object({
          fileId: z.string().describe("The ID of the file or folder to move."),
          newParentId: z.string().describe("The ID of the destination folder."),
        }),
        execute: async ({ fileId, newParentId }) => {
          try {
            // First get current parents
            const file = await drive.files.get({
              fileId,
              fields: 'parents',
            });
            const previousParents = file.data.parents?.join(',') || '';
            
            // Move the file
            const response = await drive.files.update({
              fileId,
              addParents: newParentId,
              removeParents: previousParents,
              fields: 'id, name, parents',
            });
            return { success: true, id: response.data.id, parents: response.data.parents };
          } catch (error) {
            console.error("Error in moveFileToFolder tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      renameFileOrFolder: tool({
        description: "Rename a file or folder.",
        inputSchema: z.object({
          fileId: z.string().describe("The ID of the file or folder."),
          newName: z.string().describe("The new name."),
        }),
        execute: async ({ fileId, newName }) => {
          try {
            const response = await drive.files.update({
              fileId,
              requestBody: { name: newName },
              fields: 'id, name',
            });
            return response.data;
          } catch (error) {
            console.error("Error in renameFileOrFolder tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      copyFile: tool({
        description: "Make a copy of a file.",
        inputSchema: z.object({
          fileId: z.string().describe("The ID of the file to copy."),
          newName: z.string().optional().describe("Optional new name for the copied file."),
          parentFolderId: z.string().optional().describe("Optional ID of the folder to place the copy in."),
        }),
        execute: async ({ fileId, newName, parentFolderId }) => {
          try {
            const requestBody: any = {};
            if (newName) requestBody.name = newName;
            if (parentFolderId) requestBody.parents = [parentFolderId];

            const response = await drive.files.copy({
              fileId,
              requestBody,
              fields: 'id, name, webViewLink',
            });
            return response.data;
          } catch (error) {
            console.error("Error in copyFile tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      deleteFile: tool({
        description: "Move a file or folder to the trash.",
        inputSchema: z.object({
          fileId: z.string().describe("The ID of the file or folder."),
        }),
        execute: async ({ fileId }) => {
          try {
            const response = await drive.files.update({
              fileId,
              requestBody: { trashed: true },
              fields: 'id, name, trashed',
            });
            return { success: true, id: response.data.id, trashed: response.data.trashed };
          } catch (error) {
            console.error("Error in deleteFile tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      permanentlyDeleteFile: tool({
        description: "Permanently delete a file or folder.",
        inputSchema: z.object({
          fileId: z.string().describe("The ID of the file or folder."),
        }),
        execute: async ({ fileId }) => {
          try {
            await drive.files.delete({ fileId });
            return { success: true, deleted: fileId };
          } catch (error) {
            console.error("Error in permanentlyDeleteFile tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      restoreFile: tool({
        description: "Restore a file or folder from the trash.",
        inputSchema: z.object({
          fileId: z.string().describe("The ID of the file or folder."),
        }),
        execute: async ({ fileId }) => {
          try {
            const response = await drive.files.update({
              fileId,
              requestBody: { trashed: false },
              fields: 'id, name, trashed',
            });
            return { success: true, id: response.data.id, trashed: response.data.trashed };
          } catch (error) {
            console.error("Error in restoreFile tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      addPermission: tool({
        description: "Share a file or folder by adding a permission.",
        inputSchema: z.object({
          fileId: z.string().describe("The ID of the file or folder."),
          role: z.enum(['reader', 'commenter', 'writer']).describe("The role to grant."),
          emailAddress: z.string().describe("The email address of the user or group."),
        }),
        execute: async ({ fileId, role, emailAddress }) => {
          try {
            const response = await drive.permissions.create({
              fileId,
              requestBody: {
                type: 'user',
                role,
                emailAddress,
              },
              fields: 'id, role, type, emailAddress',
            });
            return response.data;
          } catch (error) {
            console.error("Error in addPermission tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      listPermissions: tool({
        description: "List permissions for a file or folder.",
        inputSchema: z.object({
          fileId: z.string().describe("The ID of the file or folder."),
        }),
        execute: async ({ fileId }) => {
          try {
            const response = await drive.permissions.list({
              fileId,
              fields: 'permissions(id, role, type, emailAddress)',
            });
            return { permissions: response.data.permissions || [] };
          } catch (error) {
            console.error("Error in listPermissions tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

    },
  });
}
