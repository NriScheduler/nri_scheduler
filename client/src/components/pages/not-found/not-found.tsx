import { h } from "preact";

import { Button, Container, Heading, Image, Link } from "@chakra-ui/react";

interface INotFoundProps {
	checkButton?: boolean;
	title?: string;
}

export const NotFoundPage = ({
	checkButton = true,
	title = "Oops! Страница, которую вы ищете, не найдена",
}: INotFoundProps) => {
	return (
		<section>
			<Container centerContent>
				<Image src="/assets/not-found.svg" alt="404" maxW="800px" />
				<Heading size="2xl">{title}</Heading>
				<Link href="/" mt={4}>
					{checkButton && <Button type="button">На главную</Button>}
				</Link>
			</Container>
		</section>
	);
};
