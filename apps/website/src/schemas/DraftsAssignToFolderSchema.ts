import { nonEmpty, object, pipe, string } from 'valibot';

export const DraftsAssignToFolderSchema = object({
	folderUuid: pipe(string('Please select a folder.'), nonEmpty('Please select a folder.')),
});
