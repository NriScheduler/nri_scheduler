import { h } from "preact";
import { useEffect, useState } from "preact/compat";
import { useForm } from "react-hook-form";

import {
	Button,
	Heading,
	Input,
	List,
	Stack,
	Text,
	Textarea,
} from "@chakra-ui/react";

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
import { addCompany, check, IApiCompany } from "../../../api";

export interface ICompanyProps {
	data: IApiCompany[];
}

export const Company = ({ data }: ICompanyProps) => {
	const [open, setOpen] = useState(false);
	const [isDisableCreateCompanyButton, setIsDisableCreateCompanyButton] =
		useState(false);
	const { register, handleSubmit, reset } = useForm<IApiCompany>();

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			setOpen(false);
		}
	}

	const onSubmit = handleSubmit((companyData) => {
		if (data) {
			const { name, system, description } = companyData;
			addCompany(name, system, description).then((res) => {
				if (res !== null) {
					reset();
					setOpen(false);
				}
			});
		}
	});

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			setOpen(false);
		};
	}, []);

	return (
		<DrawerRoot
			open={open}
			onOpenChange={(e) => {
				if (e.open) {
					setIsDisableCreateCompanyButton(true);
					check().then((res) => {
						if (res !== null) {
							setOpen(e.open);
							setIsDisableCreateCompanyButton(false);
						}
					});
				} else {
					setOpen(e.open);
				}
			}}
		>
			<DrawerBackdrop />
			<DrawerTrigger asChild>
				<Button disabled={isDisableCreateCompanyButton} variant="outline">
					Создать кампанию
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Создание кампании</DrawerTitle>
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
									{...register("name", { required: "Заполните поле" })}
								/>
							</Field>
							<Field label="Система *">
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
						<Button type="submit" w="full" mt={6}>
							Создать
						</Button>
					</form>
					<Heading size="md" mt={6} mb={4}>
						Доступные мне
					</Heading>
					{data ? (
						<List.Root as="ol" ml={4}>
							{data.map((item) => (
								<List.Item key={item.id}>{item.name}</List.Item>
							))}
						</List.Root>
					) : (
						<Text>Список пуст</Text>
					)}
				</DrawerBody>
				<DrawerCloseTrigger />
			</DrawerContent>
		</DrawerRoot>
	);
};
