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
	XCircleIcon,
} from 'lucide-react';
import { useEffect, useState, type ComponentProps } from 'react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Field';
import { Input, InputGroup } from '@/components/ui/Input';
import { Modal, ModalBody, ModalClose, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { cx } from '@/styles/cva';
import { logger, LogCategory } from '@/util/logger';
import { BlockLatexPlugin, InlineLatexPlugin } from './LatexPlugin';
import '@benrbray/prosemirror-math/dist/prosemirror-math.css';
import 'katex/dist/katex.min.css';

const TOOLBAR_BUTTON_ACTIVE_STYLES =
	'bg-base-neutral-100 hover:bg-base-neutral-200 focus-visible:bg-base-neutral-200 pressed:bg-base-neutral-300 dark:bg-base-neutral-700 dark:hover:bg-base-neutral-600 dark:focus-visible:bg-base-neutral-600 dark:pressed:bg-base-neutral-500';

const TOOLBAR_BUTTON_BASE_STYLES = 'h-8 w-8 p-[7px]';

function EditorSetLinkDialog(props: { readonly href: string; onChange(href: string): void }) {
	const [href, setHref] = useState(props.href);

	useEffect(() => {
		setHref(props.href);
	}, [props.href]);

	return (
		<ModalContent>
			<ModalHeader hidden />
			<ModalBody>
				<TextField autoFocus onChange={(value) => setHref(value)} value={href}>
					<Label>{props.href ? 'Edit link' : 'Set link'}</Label>
					<InputGroup>
						<Input placeholder="Enter URL" />
						{href ? (
							<Button aria-label="Clear URL" onPress={() => setHref('')} size="icon" variant="unset">
								<XCircleIcon aria-hidden className="size-6 shrink-0 stroke-[1.5]" />
							</Button>
						) : null}
					</InputGroup>
				</TextField>
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
						? 'prose prose-sm max-h-40 min-h-24 max-w-[536px] overflow-auto rounded-b border border-t-0 border-base-neutral-300 bg-base-neutral-0 p-3.5 text-base-md! text-base-neutral-900 outline-0 transition-all placeholder:text-base-neutral-400 hover:border-base-neutral-200 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-base-neutral-100 disabled:opacity-38 disabled:hover:border-transparent sm:prose-base lg:prose-lg xl:prose-2xl dark:border-base-neutral-500 dark:bg-base-neutral-800 dark:text-base-neutral-40 dark:prose-invert dark:placeholder:text-base-neutral-500 dark:hover:border-base-neutral-600 dark:disabled:border-transparent dark:disabled:bg-base-neutral-700 dark:disabled:hover:border-transparent'
						: 'prose prose-sm max-w-none text-base-md! text-base-neutral-900 prose-neutral sm:prose-base lg:prose-lg xl:prose-2xl dark:text-base-neutral-40 dark:prose-invert',
				),
			},
		},
		content,
		editable,
		onUpdate({ editor }) {
			props.onChange?.(editor.getJSON());
		},
		onContentError({ error }) {
			logger.error(LogCategory.Editor, 'Content error encountered', { error });
		},
	});

	if (!editor) {
		return null;
	}

	return (
		<EditorContent {...props} editor={editor}>
			{editable ? (
				<div className="flex min-h-12 flex-wrap gap-x-6 rounded-t border border-base-neutral-300 border-b-base-neutral-100 p-2 dark:border-base-neutral-500">
					<div>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Bold"
								className={cx(TOOLBAR_BUTTON_BASE_STYLES, editor.isActive('bold') && TOOLBAR_BUTTON_ACTIVE_STYLES)}
								isDisabled={!editor.can().chain().focus().toggleBold().run()}
								onPress={() => editor.chain().focus().toggleBold().run()}
								variant="discreet"
							>
								<BoldIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent arrow={false}>Bold</TooltipContent>
						</Tooltip>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Italic"
								className={cx(TOOLBAR_BUTTON_BASE_STYLES, editor.isActive('italic') && TOOLBAR_BUTTON_ACTIVE_STYLES)}
								isDisabled={!editor.can().chain().focus().toggleItalic().run()}
								onPress={() => editor.chain().focus().toggleItalic().run()}
								variant="discreet"
							>
								<ItalicIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent arrow={false}>Italic</TooltipContent>
						</Tooltip>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Underline"
								className={cx(TOOLBAR_BUTTON_BASE_STYLES, editor.isActive('underline') && TOOLBAR_BUTTON_ACTIVE_STYLES)}
								isDisabled={!editor.can().chain().focus().toggleUnderline().run()}
								onPress={() => editor.chain().focus().toggleUnderline().run()}
								variant="discreet"
							>
								<UnderlineIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent arrow={false}>Underline</TooltipContent>
						</Tooltip>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Strikethrough"
								className={cx(TOOLBAR_BUTTON_BASE_STYLES, editor.isActive('strike') && TOOLBAR_BUTTON_ACTIVE_STYLES)}
								isDisabled={!editor.can().chain().focus().toggleStrike().run()}
								onPress={() => editor.chain().focus().toggleStrike().run()}
								variant="discreet"
							>
								<StrikethroughIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent arrow={false}>Strike</TooltipContent>
						</Tooltip>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Subscript"
								className={cx(TOOLBAR_BUTTON_BASE_STYLES, editor.isActive('subscript') && TOOLBAR_BUTTON_ACTIVE_STYLES)}
								isDisabled={!editor.can().chain().focus().toggleSubscript().run()}
								onPress={() => editor.chain().focus().toggleSubscript().run()}
								variant="discreet"
							>
								<SubscriptIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent arrow={false}>Subscript</TooltipContent>
						</Tooltip>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Superscript"
								className={cx(
									TOOLBAR_BUTTON_BASE_STYLES,
									editor.isActive('superscript') && TOOLBAR_BUTTON_ACTIVE_STYLES,
								)}
								isDisabled={!editor.can().chain().focus().toggleSuperscript().run()}
								onPress={() => editor.chain().focus().toggleSuperscript().run()}
								variant="discreet"
							>
								<SuperscriptIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent arrow={false}>Superscript</TooltipContent>
						</Tooltip>
					</div>

					<div>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Bullet list"
								className={cx(
									TOOLBAR_BUTTON_BASE_STYLES,
									editor.isActive('bulletList') && TOOLBAR_BUTTON_ACTIVE_STYLES,
								)}
								isDisabled={!editor.can().chain().focus().toggleBulletList().run()}
								onPress={() => editor.chain().focus().toggleBulletList().run()}
								variant="discreet"
							>
								<ListIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent arrow={false}>Bullet list</TooltipContent>
						</Tooltip>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Ordered list"
								className={cx(
									TOOLBAR_BUTTON_BASE_STYLES,
									editor.isActive('orderedList') && TOOLBAR_BUTTON_ACTIVE_STYLES,
								)}
								isDisabled={!editor.can().chain().focus().toggleOrderedList().run()}
								onPress={() => editor.chain().focus().toggleOrderedList().run()}
								variant="discreet"
							>
								<ListOrderedIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent arrow={false}>Ordered list</TooltipContent>
						</Tooltip>
					</div>

					<div>
						<Modal>
							<Tooltip delay={400}>
								<TooltipTrigger
									aria-label={editor.isActive('link') ? 'Edit link' : 'Set link'}
									className={cx(TOOLBAR_BUTTON_BASE_STYLES, editor.isActive('link') && TOOLBAR_BUTTON_ACTIVE_STYLES)}
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
								<TooltipContent arrow={false}>{editor.isActive('link') ? 'Edit link' : 'Set link'}</TooltipContent>
							</Tooltip>
						</Modal>
						<Tooltip delay={400}>
							<TooltipTrigger
								aria-label="Unset link"
								className={TOOLBAR_BUTTON_BASE_STYLES}
								isDisabled={!editor.isActive('link')}
								onPress={() => editor.chain().focus().unsetLink().run()}
								variant="discreet"
							>
								<UnlinkIcon aria-hidden size={18} strokeWidth={1.5} />
							</TooltipTrigger>
							<TooltipContent arrow={false}>Unset link</TooltipContent>
						</Tooltip>
					</div>
				</div>
			) : null}
		</EditorContent>
	);
}
