'use client';

import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Document from '@tiptap/extension-document';
import History from '@tiptap/extension-history';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Strike from '@tiptap/extension-strike';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Text from '@tiptap/extension-text';
import Underline from '@tiptap/extension-underline';
import type { EditorOptions } from '@tiptap/react';
import { useEditor, EditorContent } from '@tiptap/react';
import {
	BoldIcon,
	ItalicIcon,
	LinkIcon,
	ListIcon,
	ListOrderedIcon,
	StrikethroughIcon,
	SubscriptIcon,
	SuperscriptIcon,
	UnderlineIcon,
	UnlinkIcon,
} from 'lucide-react';
import { useEffect, useState, type ComponentProps } from 'react';
import { Modal, ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { cx } from '@/styles/cva';
import { BlockLatexPlugin, InlineLatexPlugin } from './LatexPlugin';

import '@benrbray/prosemirror-math/dist/prosemirror-math.css';
import 'katex/dist/katex.min.css';

function EditorSetLinkDialog(props: { readonly href: string; onChange(href: string): void }) {
	const [href, setHref] = useState(props.href);

	useEffect(() => {
		setHref(props.href);
	}, [props.href]);

	return (
		<ModalContent>
			<ModalHeader hidden />
			<ModalBody>
				<TextField
					autoFocus
					isClearable
					label={props.href ? 'Edit link' : 'Set link'}
					onChange={(value) => setHref(value)}
					placeholder="Enter URL"
					value={href}
				/>
			</ModalBody>
			<ModalFooter>
				<ModalClose variant="secondary-discreet">Cancel</ModalClose>
				<ModalClose
					onPress={() => {
						props.onChange?.(href);
						setHref('');
					}}
					type="submit"
					variant="filled"
				>
					Save changes
				</ModalClose>
			</ModalFooter>
		</ModalContent>
	);
}

export function Editor({
	content = '',
	placeholder = '',
	editable = false,
	...props
}: Omit<ComponentProps<typeof EditorContent>, 'content' | 'editor'> & {
	readonly content?: EditorOptions['content'];
	readonly editable?: boolean | undefined;
	onChange?(...event: any): void;
	readonly placeholder?: string | undefined;
}) {
	// eslint-disable-next-line react-compiler/react-compiler
	'use no memo';

	const editor = useEditor({
		immediatelyRender: false,
		enableContentCheck: true,
		extensions: [
			Document,
			Paragraph,
			Text,
			Bold,
			Italic,
			Underline,
			Strike,
			Subscript,
			Superscript,
			BulletList,
			OrderedList,
			ListItem,
			Link.configure({
				HTMLAttributes: {
					class:
						'text-base-lavender-500 hover:underline rounded-sm focus-visible:underline active:text-base-lavender-600 dark:active:text-base-lavender-400 outline-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-base-lavender-400 dark:outline-base-lavender-600 forced-colors:outline-[Highlight]',
				},
				openOnClick: false,
			}),
			History,
			Placeholder.configure({
				placeholder,
			}),
			InlineLatexPlugin,
			BlockLatexPlugin,
		],
		editorProps: {
			attributes: {
				class: cx(
					editable
						? 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl border-base-neutral-300 bg-base-neutral-0 text-base-md! text-base-neutral-900 placeholder:text-base-neutral-400 hover:border-base-neutral-200 disabled:border-base-neutral-100 disabled:bg-base-neutral-100 disabled:hover:border-base-neutral-100 dark:border-base-neutral-500 dark:bg-base-neutral-800 dark:text-base-neutral-40 dark:placeholder:text-base-neutral-500 dark:hover:border-base-neutral-600 dark:disabled:border-base-neutral-700 dark:disabled:bg-base-neutral-700 dark:disabled:hover:border-base-neutral-700 max-h-40 min-h-24 max-w-[536px] overflow-auto rounded-b border border-t-0 p-[14px] outline-0 transition-all disabled:cursor-not-allowed disabled:opacity-38'
						: 'prose-neutral dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl text-base-md! text-base-neutral-900 dark:text-base-neutral-40 max-w-none',
				),
			},
		},
		content,
		editable,
		onUpdate({ editor }) {
			props.onChange?.(editor.getJSON());
		},
		onContentError({ error }) {
			console.error('Editor encountered an error:', error);
		},
	});

	if (!editor) {
		return null;
	}

	return (
		<EditorContent {...props} editor={editor}>
			{editable ? (
				<div className="border-base-neutral-300 border-b-base-neutral-100 dark:border-base-neutral-500 flex min-h-12 flex-wrap gap-x-6 rounded-t border p-2">
					<div>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Bold"
								className={cx(
									'h-8 w-8 p-[7px]',
									editor.isActive('bold')
										? 'bg-base-neutral-100 hover:bg-base-neutral-200 focus-visible:bg-base-neutral-200 pressed:bg-base-neutral-300 dark:bg-base-neutral-700 dark:hover:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-600 dark:pressed:bg-base-neutral-500'
										: '',
								)}
								isDisabled={!editor.can().chain().focus().toggleBold().run()}
								onPress={() => editor.chain().focus().toggleBold().run()}
								variant="discreet"
							>
								<BoldIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent showArrow={false}>Bold</TooltipContent>
						</Tooltip>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Italic"
								className={cx(
									'h-8 w-8 p-[7px]',
									editor.isActive('italic')
										? 'bg-base-neutral-100 hover:bg-base-neutral-200 focus-visible:bg-base-neutral-200 pressed:bg-base-neutral-300 dark:bg-base-neutral-700 dark:hover:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-600 dark:pressed:bg-base-neutral-500'
										: '',
								)}
								isDisabled={!editor.can().chain().focus().toggleItalic().run()}
								onPress={() => editor.chain().focus().toggleItalic().run()}
								variant="discreet"
							>
								<ItalicIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent showArrow={false}>Italic</TooltipContent>
						</Tooltip>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Underline"
								className={cx(
									'h-8 w-8 p-[7px]',
									editor.isActive('underline')
										? 'bg-base-neutral-100 hover:bg-base-neutral-200 focus-visible:bg-base-neutral-200 pressed:bg-base-neutral-300 dark:bg-base-neutral-700 dark:hover:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-600 dark:pressed:bg-base-neutral-500'
										: '',
								)}
								isDisabled={!editor.can().chain().focus().toggleUnderline().run()}
								onPress={() => editor.chain().focus().toggleUnderline().run()}
								variant="discreet"
							>
								<UnderlineIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent showArrow={false}>Underline</TooltipContent>
						</Tooltip>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Strikethrough"
								className={cx(
									'h-8 w-8 p-[7px]',
									editor.isActive('strike')
										? 'bg-base-neutral-100 hover:bg-base-neutral-200 focus-visible:bg-base-neutral-200 pressed:bg-base-neutral-300 dark:bg-base-neutral-700 dark:hover:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-600 dark:pressed:bg-base-neutral-500'
										: '',
								)}
								isDisabled={!editor.can().chain().focus().toggleStrike().run()}
								onPress={() => editor.chain().focus().toggleStrike().run()}
								variant="discreet"
							>
								<StrikethroughIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent showArrow={false}>Strike</TooltipContent>
						</Tooltip>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Subscript"
								className={cx(
									'h-8 w-8 p-[7px]',
									editor.isActive('subscript')
										? 'bg-base-neutral-100 hover:bg-base-neutral-200 focus-visible:bg-base-neutral-200 pressed:bg-base-neutral-300 dark:bg-base-neutral-700 dark:hover:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-600 dark:pressed:bg-base-neutral-500'
										: '',
								)}
								isDisabled={!editor.can().chain().focus().toggleSubscript().run()}
								onPress={() => editor.chain().focus().toggleSubscript().run()}
								variant="discreet"
							>
								<SubscriptIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent showArrow={false}>Subscript</TooltipContent>
						</Tooltip>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Superscript"
								className={cx(
									'h-8 w-8 p-[7px]',
									editor.isActive('superscript')
										? 'bg-base-neutral-100 hover:bg-base-neutral-200 focus-visible:bg-base-neutral-200 pressed:bg-base-neutral-300 dark:bg-base-neutral-700 dark:hover:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-600 dark:pressed:bg-base-neutral-500'
										: '',
								)}
								isDisabled={!editor.can().chain().focus().toggleSuperscript().run()}
								onPress={() => editor.chain().focus().toggleSuperscript().run()}
								variant="discreet"
							>
								<SuperscriptIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent showArrow={false}>Superscript</TooltipContent>
						</Tooltip>
					</div>

					<div>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Bullet list"
								className={cx(
									'h-8 w-8 p-[7px]',
									editor.isActive('bulletList')
										? 'bg-base-neutral-100 hover:bg-base-neutral-200 focus-visible:bg-base-neutral-200 pressed:bg-base-neutral-300 dark:bg-base-neutral-700 dark:hover:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-600 dark:pressed:bg-base-neutral-500'
										: '',
								)}
								isDisabled={!editor.can().chain().focus().toggleBulletList().run()}
								onPress={() => editor.chain().focus().toggleBulletList().run()}
								variant="discreet"
							>
								<ListIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent showArrow={false}>Bullet list</TooltipContent>
						</Tooltip>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Ordered list"
								className={cx(
									'h-8 w-8 p-[7px]',
									editor.isActive('orderedList')
										? 'bg-base-neutral-100 hover:bg-base-neutral-200 focus-visible:bg-base-neutral-200 pressed:bg-base-neutral-300 dark:bg-base-neutral-700 dark:hover:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-600 dark:pressed:bg-base-neutral-500'
										: '',
								)}
								isDisabled={!editor.can().chain().focus().toggleOrderedList().run()}
								onPress={() => editor.chain().focus().toggleOrderedList().run()}
								variant="discreet"
							>
								<ListOrderedIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent showArrow={false}>Ordered list</TooltipContent>
						</Tooltip>
					</div>

					<div>
						<Modal>
							<Tooltip delay={400}>
								<TooltipTrigger
									aria-label={editor.isActive('link') ? 'Edit link' : 'Set link'}
									className={cx(
										'h-8 w-8 p-[7px]',
										editor.isActive('link')
											? 'bg-base-neutral-100 hover:bg-base-neutral-200 focus-visible:bg-base-neutral-200 pressed:bg-base-neutral-300 dark:bg-base-neutral-700 dark:hover:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-600 dark:pressed:bg-base-neutral-500'
											: '',
									)}
									variant="discreet"
								>
									<LinkIcon aria-hidden size={18} strokeWidth={1.5} />
								</TooltipTrigger>
								<EditorSetLinkDialog
									href={editor.getAttributes('link').href}
									onChange={(href) => {
										if (href) {
											editor.chain().focus().setLink({ href }).run();
										} else {
											editor.chain().focus().unsetLink().run();
										}
									}}
								/>
								<TooltipContent showArrow={false}>{editor.isActive('link') ? 'Edit link' : 'Set link'}</TooltipContent>
							</Tooltip>
						</Modal>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Unset link"
								className="h-8 w-8 p-[7px]"
								isDisabled={!editor.isActive('link')}
								onPress={() => editor.chain().focus().unsetLink().run()}
								variant="discreet"
							>
								<UnlinkIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent showArrow={false}>Unset link</TooltipContent>
						</Tooltip>
					</div>
				</div>
			) : null}
		</EditorContent>
	);
}
