import "@schedule-x/theme-default/dist/index.css";
import "../calendar/calendar.css";

import type { UUID } from "node:crypto";

import { Fragment, h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useRouter } from "preact-router";
import { useForm } from "react-hook-form";

import {
	Button,
	Card,
	Container,
	DataList,
	Heading,
	HStack,
	Image,
	Input,
	Link,
	Skeleton,
	Stack,
	Text,
	Textarea,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";

import { NotFoundPage } from "../not-found/not-found";
import { EventItem } from "../../event-item";
import { GridLayout } from "../../grid-layout";
import {
	DrawerBackdrop,
	DrawerBody,
	DrawerCloseTrigger,
	DrawerContent,
	DrawerHeader,
	DrawerRoot,
	DrawerTitle,
	DrawerTrigger,
} from "../../ui/drawer";
import { Field } from "../../ui/field";
import { IApiCompanyInfo, readCompanyById, updateCompany } from "../../../api";
import { $eventsStore, fetchEvents } from "../../../store/eventList";
import { convertEventStyleToCSS, navBack } from "../../../utils";

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
					<Heading size="3xl">Кампания - {company.name}</Heading>
					<div
						className="sx__month-grid-event"
						style={convertEventStyleToCSS(company.event_style)}
					>
						Внешний вид события в календаре
					</div>
				</HStack>
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
			</Card.Body>
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
			</Card.Body>
		</Card.Root>
	);
};

export const CompanyPage = () => {
	const [route] = useRouter();
	const companyId = route.matches?.id as UUID;
	const [fetching, setFetching] = useState(false);
	const [company, setCompany] = useState<IApiCompanyInfo | null>(null);

	const { list, title, isLoading, isMaster } = useStore($eventsStore);

	const [open, setOpen] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<IApiCompanyInfo>();

	const onSubmit = handleSubmit((companyData) => {
		if (companyId) {
			const { name, system, description } = companyData;
			setFetching(true);
			updateCompany(companyId, { name, system, description })
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
		document.addEventListener("keydown", onEscClose, { passive: true });
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

	useEffect(() => {
		if (company !== null) {
			fetchEvents({
				you_are_master: company?.you_are_master,
				company_id: companyId,
			});
		}
	}, [company]);

	if (isLoading) {
		return <Text>Загрузка...</Text>;
	}

	return (
		<Container>
			<Button mb={4} onClick={navBack}>
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
							<Button colorPalette="cyan" mt="4" mb="4" variant="solid">
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
										<Field
											label="Название *"
											errorText={errors.name?.message}
											invalid={!!errors.name?.message}
										>
											<Input
												placeholder="Заполните поле"
												{...register("name", {
													required: "Заполните поле",
												})}
												defaultValue={company?.name}
											/>
										</Field>
										<Field
											label="Система *"
											errorText={errors.system?.message}
											invalid={!!errors.system?.message}
										>
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
			<Image
				height={200}
				width="100%"
				src="/assets/company_cover.webp"
				alt="Обложка кампании"
			/>
			{fetching ? (
				<CompanyCardSkeleton />
			) : company !== null ? (
				<Fragment>
					<CompanyCard company={company} />
					<Stack mt={2} mb={6}>
						<Heading size="xl">{title}</Heading>
						<GridLayout gridColumns={4}>
							{list.map((item) => (
								<EventItem
									item={item}
									key={item.id}
									isMaster={isMaster}
								/>
							))}
						</GridLayout>
					</Stack>
				</Fragment>
			) : (
				<NotFoundPage
					checkButton={false}
					title="Кампания не найдена, попробуйте еще раз!"
				/>
			)}
		</Container>
	);
};
