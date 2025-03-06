import type { UUID } from "node:crypto";

import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useRouter } from "preact-router";
import { useForm } from "react-hook-form";

import {
	Button,
	Card,
	Container,
	DataList,
	DrawerBackdrop,
	DrawerBody,
	DrawerCloseTrigger,
	DrawerContent,
	DrawerHeader,
	DrawerRoot,
	DrawerTitle,
	DrawerTrigger,
	Heading,
	HStack,
	Input,
	Link,
	Skeleton,
	Stack,
	Textarea,
} from "@chakra-ui/react";

import { NotFoundPage } from "../not-found/not-found";
import { Field } from "../../ui/field";
import { IApiCompanyInfo, readCompanyById, updateCompany } from "../../../api";

const CompanyCard = ({ company }: { company: IApiCompanyInfo }) => {
	const stats = [
		{ label: "Система", value: company.system },
		{ label: "Мастер игры", value: company.master_name, href: "#" },
		{ label: "Описание", value: company.description },
	];

	return (
		<Card.Root width="full">
			<Card.Body>
				<HStack mb="6" gap="3">
					<Heading size="3xl">Компания - {company.name}</Heading>
				</HStack>
				<Card.Description>
					<DataList.Root orientation="horizontal">
						{stats.map((item) => (
							<DataList.Item key={item.label}>
								<DataList.ItemLabel minW="150px">
									{item.label}
								</DataList.ItemLabel>
								<DataList.ItemValue color="black" fontWeight="500">
									{item.href ? (
										<Link href={item.href} colorPalette="blue">
											{item.value}
										</Link>
									) : (
										<span>{item.value}</span>
									)}
								</DataList.ItemValue>
							</DataList.Item>
						))}
					</DataList.Root>
				</Card.Description>
			</Card.Body>
			<Card.Footer></Card.Footer>
		</Card.Root>
	);
};

const CompanyCardSkeleton = () => {
	const stats = [
		{ label: "Имя" },
		{ label: "Система" },
		{ label: "Мастер" },
		{ label: "Описание" },
	];

	return (
		<Card.Root width="full">
			<Card.Body>
				<HStack mb="6" gap="3">
					<Skeleton height="38px" w="30%" />
				</HStack>
				<Card.Description>
					<DataList.Root orientation="horizontal">
						{stats.map((item, index) => (
							<DataList.Item key={index}>
								<DataList.ItemLabel minW="150px">
									{item.label}
								</DataList.ItemLabel>
								<DataList.ItemValue color="black" fontWeight="500">
									<Skeleton height="20px" w="30%" />
								</DataList.ItemValue>
							</DataList.Item>
						))}
					</DataList.Root>
				</Card.Description>
			</Card.Body>
		</Card.Root>
	);
};

export const CompanyPage = () => {
	const [route] = useRouter();
	const companyId = route.matches?.id as UUID;
	const [fetching, setFetching] = useState(false);
	const [company, setCompany] = useState<IApiCompanyInfo | null>(null);
	const [open, setOpen] = useState(false);
	const { register, handleSubmit } = useForm<IApiCompanyInfo>();

	const onSubmit = handleSubmit((companyData) => {
		if (companyId) {
			const { name, system, description } = companyData;
			setFetching(true);
			updateCompany(companyId, name, system, description)
				.then((res) => {
					if (res !== null) {
						setOpen(false);
					}
				})
				.then(() => readCompanyById(companyId))
				.then((res) => {
					if (res !== null) {
						const result = res.payload;
						setCompany(result);
					}
				})
				.finally(() => {
					setFetching(false);
				});
		}
	});

	useEffect(() => {
		const onEscClose = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setOpen(false);
			}
		};
		document.addEventListener("keydown", onEscClose);
		if (companyId) {
			setFetching(true);
			readCompanyById(companyId)
				.then((res) => {
					if (res !== null) {
						setCompany(res.payload);
					}
				})
				.finally(() => {
					setFetching(false);
				});
		}
		return () => {
			document.removeEventListener("keydown", onEscClose);
		};
	}, [companyId]);

	const handleBackButton = () => {
		window.history.back();
	};

	return (
		<section>
			<Container>
				<Button mb={4} onClick={handleBackButton}>
					Вернуться назад
				</Button>
				{company?.you_are_master && (
					<HStack alignItems="top">
						<DrawerRoot
							open={open}
							onOpenChange={(e) => {
								setOpen(e.open);
							}}
						>
							<DrawerBackdrop />
							<DrawerTrigger asChild>
								<Button mt="4" mb="4" variant="outline">
									Редактировать кампанию
								</Button>
							</DrawerTrigger>
							<DrawerContent>
								<DrawerHeader>
									<DrawerTitle>Редактирование кампании</DrawerTitle>
								</DrawerHeader>
								<DrawerBody>
									<form onSubmit={onSubmit}>
										<Stack
											gap="4"
											align="flex-start"
											maxW="lg"
											w="full"
											mx="auto"
										>
											<Field label="Название *">
												<Input
													placeholder="Заполните поле"
													{...register("name", {
														required: "Заполните поле",
													})}
													defaultValue={company?.name}
												/>
											</Field>
											<Field label="Система *">
												<Input
													placeholder="Заполните поле"
													{...register("system", {
														required: "Заполните поле",
													})}
													defaultValue={company?.system}
												/>
											</Field>
											<Field label="Описание">
												<Textarea
													placeholder="Расскажите о своей кампании"
													{...register("description")}
												>
													{company?.description}
												</Textarea>
											</Field>
										</Stack>
										<Button type="submit" w="full" mt={6}>
											Редактировать
										</Button>
										<DrawerTrigger asChild>
											<Button type="button" w="full" mt={6}>
												Отмена
											</Button>
										</DrawerTrigger>
									</form>
								</DrawerBody>
								<DrawerCloseTrigger />
							</DrawerContent>
						</DrawerRoot>
					</HStack>
				)}
				{fetching ? (
					<CompanyCardSkeleton />
				) : company !== null ? (
					<CompanyCard company={company} />
				) : (
					<NotFoundPage
						checkButton={false}
						title="Кампания не найдена, попробуйте еще раз!"
					/>
				)}
			</Container>
		</section>
	);
};
