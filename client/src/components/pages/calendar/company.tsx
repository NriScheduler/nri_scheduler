import { h } from "preact";
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
import { useStore } from "@nanostores/preact";

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
import { addCompany, IApiCompany } from "../../../api";
import { $profile } from "../../../store/profile";
import { loadCompanies, sharedCompanies } from "../../../store/sharedDataStore";

export interface ICompanyProps {
	isOpen: boolean;
	openDrawer: () => void;
	closeDrawer: () => void;
}

const Company = ({ isOpen, openDrawer, closeDrawer }: ICompanyProps) => {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<IApiCompany>();

	const profile = useStore($profile);
	const companies = useStore(sharedCompanies);

	const onSubmit = handleSubmit((companyData) => {
		if (companies) {
			const { name, system, description } = companyData;
			addCompany(name, system, description).then((res) => {
				if (res !== null) {
					reset();
					closeDrawer();
					loadCompanies().then(sharedCompanies.set);
				}
			});
		}
	});

	return (
		<DrawerRoot
			open={isOpen}
			onOpenChange={(e) => (e.open ? openDrawer() : closeDrawer())}
		>
			<DrawerBackdrop />
			<DrawerTrigger asChild>
				<Button w="30%" disabled={!profile?.signed} variant="outline">
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
							<Field
								label="Название *"
								errorText={errors.name?.message}
								invalid={!!errors.name?.message}
							>
								<Input
									placeholder="Заполните поле"
									{...register("name", { required: "Заполните поле" })}
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
						<Button type="submit" w="full" mt={6}>
							Создать
						</Button>
					</form>
					<Heading size="md" mt={6} mb={4}>
						Доступные мне
					</Heading>
					{companies ? (
						<List.Root as="ol" ml={4}>
							{companies.map((item) => (
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

export default Company;
