import { Fragment, h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route as navigate, useRouter } from "preact-router";

import { Box, Button, Container, HStack, Image, Link } from "@chakra-ui/react";

import { Check, Error } from "../../ui/icons";
import { toaster } from "../../ui/toaster";
import { EVerificationChannel, softCheck, verifyEmail } from "../../../api";

export const VerificationPage = () => {
	const [{ matches }] = useRouter();
	const { channel, code } = matches || {};

	if (channel !== EVerificationChannel.EMAIL || !code) {
		toaster.error({ title: "Некорректная ссылка подтверждения" });
		navigate("/calendar");
		return;
	}

	const [fetching, setFetching] = useState(true);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout> | undefined;

		verifyEmail(code).then((res) => {
			if (res) {
				softCheck();
				toaster.success({
					title: "Электронная почта успешно верифицирована",
				});
				setSuccess(true);
			}
			setFetching(false);
			timeout = setTimeout(() => navigate("/calendar"), 5000);
		});

		return () => clearTimeout(timeout);
	}, []);

	return (
		<Container mb={6}>
			{fetching ? (
				<Image src="/assets/spinning_dots.svg" alt="loading" />
			) : (
				<>
					<Box width="100%" padding="4" borderWidth="1px">
						<HStack>
							{success ? (
								<>
									<Check />
									<>Электронная почта успешно верифицирована</>
								</>
							) : (
								<>
									<Error />
									<>Не удалось верифицировать электронную почту</>
								</>
							)}
						</HStack>
					</Box>
					<Link href="/calendar" mt={4}>
						<Button type="button">Календарь</Button>
					</Link>
				</>
			)}
		</Container>
	);
};

export default VerificationPage;
