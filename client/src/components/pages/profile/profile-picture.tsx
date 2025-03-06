import { h, JSX, Fragment } from "preact";
import { useRef, useState } from "preact/hooks";
import { Avatar, Button, Group, HStack, Stack } from "@chakra-ui/react";

export const ProfilePicture = ({ register, username }: any) => {
	const hiddenInputRef = useRef<HTMLInputElement>(null);
	const [preview, setPreview] = useState<string | null>(null);

	const { ref: registerRef, ...rest } = register("avatar");

	const handleUploadedFile = (
		event: JSX.TargetedEvent<HTMLInputElement, Event>
	) => {
		const file = event.currentTarget.files?.[0];

		if (file && file.type.startsWith("image/")) {
			const urlImage = URL.createObjectURL(file);
			setPreview(urlImage);
		} else {
			alert("Пожалуйста, выберите изображение.");
		}
	};
	const onUpload = () => {
		hiddenInputRef.current?.click();
	};

	const uploadButtonLabel = preview ? "Выбрать другое фото" : "Загрузить фото";

	return (
		<>
			<input
				type="file"
				name="profilePicture"
				{...rest}
				onChange={handleUploadedFile}
				ref={(e) => {
					registerRef(e);
					hiddenInputRef.current = e;
				}}
				style={{ display: "none" }}
				accept="image/*"
			/>
			<HStack>
				<Avatar.Root w="100px" h="100px">
					<Avatar.Fallback name={username} />
					<Avatar.Image src={preview || undefined} />
				</Avatar.Root>
				<Group>
					<Button variant="outline" onClick={onUpload}>
						{uploadButtonLabel}
					</Button>
					<Button variant="surface" colorPalette="red">Удалить</Button>
				</Group>
			</HStack>
		</>
	);
};
