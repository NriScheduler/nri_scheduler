import { h, JSX, Fragment } from "preact";
import { useRef, useState } from "preact/hooks";
import { Avatar, Button } from "@chakra-ui/react";

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

			<Avatar.Root w="full" h="90px" shape="rounded">
				<Avatar.Fallback name={username} />
				<Avatar.Image src={preview || undefined} />
			</Avatar.Root>

			<Button variant="outline" onClick={onUpload}>
				{uploadButtonLabel}
			</Button>
		</>
	);
};
