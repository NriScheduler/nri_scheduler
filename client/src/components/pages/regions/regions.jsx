import { h } from "preact";
import { useStore } from "@nanostores/preact";
import { $regions, $regionsLoading } from "../../../store/regions";
import { Container } from "@chakra-ui/react";
import { RegionForm } from "./regionForm";
import { CityForm } from "./cityForm";
import { useAuthVerification } from "../../../utils";

export const RegionsPage = () => {
   const allRegions = useStore($regions);
   const loading = useStore($regionsLoading);

   const { isVerified } = useAuthVerification();

   if (!isVerified) {
      return null; // Или лоадер
   }

   return (
      <Container>
         <RegionForm />
         <CityForm regionOptions={allRegions} loading={loading} />
      </Container>
   );
};

export default RegionsPage
