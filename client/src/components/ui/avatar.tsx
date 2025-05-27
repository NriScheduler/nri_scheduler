import { h } from "preact";

import { Avatar as Ava } from "@chakra-ui/react";

export interface IAvatarProps {
	readonly fallback?: string;
	readonly src?: string | null;
	readonly w?: string;
	readonly h?: string;
}

export const Avatar = (p: IAvatarProps) => (
	<Ava.Root w={p.w} h={p.h}>
		{p.fallback && <Ava.Fallback name={p.fallback} />}
		<Ava.Image src={p.src ?? undefined} />
	</Ava.Root>
);
