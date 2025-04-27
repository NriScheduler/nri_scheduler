import type { UUID } from "node:crypto";

import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useRouter } from "preact-router";

import {
	Button,
	Card,
	Container,
	DataList,
	Heading,
	HStack,
	Image,
	Skeleton,
} from "@chakra-ui/react";

import { NotFoundPage } from "../not-found/not-found";
import { IApiLocation, readLocationById } from "../../../api";
import { calcMapIconLink, navBack } from "../../../utils";

const LocationCard = ({ location }: { location: IApiLocation }) => {
	const stats = [
		{ label: "Регион", value: location.region },
		{ label: "Город", value: location.city },
		{ label: "Адрес", value: location.address },
		{ label: "Описание", value: location.description },
	];

	const iconLink = calcMapIconLink(location.map_link);

	return (
		<Card.Root width="full">
			<Card.Body>
				<HStack mb="6" gap="3">
					<Heading size="3xl">
						<HStack>
							<span>Локация - {location.name}</span>
							{iconLink && (
								<a
									target="_blank"
									href={location.map_link as string}
									rel="noreferrer"
								>
									<Image
										height="2.375rem"
										src={iconLink}
										alt="Показать локацию на карте"
									/>
								</a>
							)}
						</HStack>
					</Heading>
				</HStack>
				<DataList.Root orientation="horizontal">
					{stats.map((item) => (
						<DataList.Item key={item.label}>
							<DataList.ItemLabel minW="150px">
								{item.label}
							</DataList.ItemLabel>
							<DataList.ItemValue color="black" fontWeight="500">
								<span>{item.value || "—"}</span>
							</DataList.ItemValue>
						</DataList.Item>
					))}
				</DataList.Root>
			</Card.Body>
			<Card.Footer></Card.Footer>
		</Card.Root>
	);
};

const LocationCardSkeleton = () => {
	const stats = [{ label: "Имя" }, { label: "Адрес" }, { label: "Описание" }];

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

export const LocationPage = () => {
	const [route] = useRouter();
	const locationId = route.matches?.id as UUID;
	const [fetching, setFetching] = useState(false);
	const [location, setLocation] = useState<IApiLocation | null>(null);

	useEffect(() => {
		if (locationId) {
			setFetching(true);
			readLocationById(locationId)
				.then((res) => {
					if (res !== null) {
						setLocation(res.payload);
					}
				})
				.finally(() => {
					setFetching(false);
				});
		}
	}, [locationId]);

	return (
		<Container>
			<Button mb={4} onClick={navBack}>
				Вернуться назад
			</Button>
			{fetching ? (
				<LocationCardSkeleton />
			) : location !== null ? (
				<LocationCard location={location} />
			) : (
				<NotFoundPage
					checkButton={false}
					title="Локация не найдена, попробуйте еще раз!"
				/>
			)}
		</Container>
	);
};
