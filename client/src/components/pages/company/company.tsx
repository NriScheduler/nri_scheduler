import "@schedule-x/theme-default/dist/index.css";
import "../calendar/calendar.css";

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
	Heading,
	HStack,
	Image,
	Input,
	Link,
	Separator,
	Skeleton,
	Stack,
	Text,
	Textarea,
} from "@chakra-ui/react";

import { PreviewCompany } from "../calendar/company";
import { NotFoundPage } from "../not-found/not-found";
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
import {
	IApiCompany,
	IApiCompanyInfo,
	readCompanyById,
	updateCompany,
} from "../../../api";
import {
	convertEventStyleToCSS,
	DEFAULT_EVENT_STYLE,
	IEventStyle,
	navBack,
	parseEventStyle,
	stringifyEventStyle,
} from "../../../utils";

interface CompanyFormValues extends IApiCompany {
	style: IEventStyle;
}

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
	const [open, setOpen] = useState(false);
	const {
		register,
		handleSubmit,
		control,
		reset,
		watch,
		formState: { errors },
	} = useForm<CompanyFormValues>();

	const onSubmit = handleSubmit((companyData) => {
		if (companyId) {
			const { name, system, description, style } = companyData;
			const eventStyle = stringifyEventStyle(style);
			setFetching(true);
			updateCompany(companyId, {
				name,
				system,
				description,
				event_style: eventStyle,
			})
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
						const companyData = res.payload;
						setCompany(res.payload);
						reset({
							name: companyData.name,
							system: companyData.system,
							description: companyData.description,
							style: companyData.event_style
								? parseEventStyle(companyData.event_style)
								: DEFAULT_EVENT_STYLE,
						});
					}
				})
				.finally(() => {
					setFetching(false);
				});
		}
		return () => {
			document.removeEventListener("keydown", onEscClose);
		};
	}, [companyId, reset]);

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
									<HStack>
										<Separator flex="1" />
										<Text flexShrink="0">Данные</Text>
										<Separator flex="1" />
									</HStack>
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
											/>
										</Field>
										<Field label="Описание">
											<Textarea
												placeholder="Расскажите о своей кампании"
												{...register("description")}
											/>
										</Field>
									</Stack>

									<Stack gap={2}>
										<HStack mt={2}>
											<Separator flex="1" />
											<Text flexShrink="0">Оформление</Text>
											<Separator flex="1" />
										</HStack>
										<PreviewCompany
											control={control}
											value={watch("name")}
										/>
									</Stack>

									<Button type="submit" w="full" mt={4}>
										Редактировать
									</Button>
									<DrawerTrigger asChild>
										<Button
											type="button"
											variant="subtle"
											w="full"
											mt={2}
										>
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
				<CompanyCard company={company} />
			) : (
				<NotFoundPage
					checkButton={false}
					title="Кампания не найдена, попробуйте еще раз!"
				/>
			)}
		</Container>
	);
};
