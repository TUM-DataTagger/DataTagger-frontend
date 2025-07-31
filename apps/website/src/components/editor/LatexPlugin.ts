import {
	makeInlineMathInputRule,
	REGEX_INLINE_MATH_DOLLARS,
	mathPlugin,
	makeBlockMathInputRule,
	REGEX_BLOCK_MATH_DOLLARS,
} from '@benrbray/prosemirror-math';
import { Node, mergeAttributes } from '@tiptap/core';
import { inputRules } from '@tiptap/pm/inputrules';

export const InlineLatexPlugin = Node.create({
	name: 'math_inline',
	group: 'inline math',
	content: 'text*',
	inline: true,
	atom: true,
	code: true,

	parseHTML() {
		return [
			{
				tag: 'math-inline',
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ['math-inline', mergeAttributes({ class: 'math-node' }, HTMLAttributes), 0];
	},

	addProseMirrorPlugins() {
		const inputRulePlugin = inputRules({
			rules: [makeInlineMathInputRule(REGEX_INLINE_MATH_DOLLARS, this.type)],
		});

		return [mathPlugin, inputRulePlugin];
	},
});

export const BlockLatexPlugin = Node.create({
	name: 'math_display',
	group: 'block math',
	content: 'text*',
	atom: true,
	code: true,

	parseHTML() {
		return [
			{
				tag: 'math-display',
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ['math-display', mergeAttributes({ class: 'math-node' }, HTMLAttributes), 0];
	},

	addProseMirrorPlugins() {
		const inputRulePlugin = inputRules({
			rules: [makeBlockMathInputRule(REGEX_BLOCK_MATH_DOLLARS, this.type)],
		});

		return [inputRulePlugin];
	},
});
