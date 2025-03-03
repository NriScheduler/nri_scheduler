import { Button, Input, Stack, Textarea } from "@chakra-ui/react";
import { h } from "preact"; // eslint-disable-line
import { Field } from "../../ui/field";
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

import { addLocation, IApiLocation } from "../../../api";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "preact/hooks";

export const Location = () => {
	const [open, setOpen] = useState(false);
	const { register, handleSubmit, reset } = useForm<IApiLocation>();

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Escape") { setOpen(false); }
	}

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			setOpen(false);
		};
	}, []);

	const onSubmit = handleSubmit((data) => {
		const { name, address, description } = data;
		if (data) {
			addLocation(name, address, description).then((res) => {
				if (res !== null) {
					console.log(res.payload);
					reset();
					setOpen(false);
				}
			});
		}
	});

	return (
		<DrawerRoot open={open} onOpenChange={(e) => {if (e) {setOpen(e.open)}}}>
			<DrawerBackdrop />
			<DrawerTrigger asChild>
				<Button variant="outline">Создать локацию</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Создание локации</DrawerTitle>
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
							<Field label="Адрес">
								<Input
									placeholder="Заполните поле"
									{...register("address")}
								/>
							</Field>
							<Field label="Описание">
								<Textarea
									placeholder="Расскажите о своей локации"
									{...register("description")}
								/>
							</Field>
						</Stack>
						<Button type="submit" w="full" mt={6}>
							Создать
						</Button>
					</form>
				</DrawerBody>
				<DrawerCloseTrigger />
			</DrawerContent>
		</DrawerRoot>
	);
};
