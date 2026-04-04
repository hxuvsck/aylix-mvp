import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { getSavedProfile, getSelectedRole, type SelectedAppRole } from "../lib/storage";

export default function IndexScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [targetRoute, setTargetRoute] = useState<string | null>(null);

    useEffect(() => {
        const loadIdentity = async () => {
            const savedProfile = await getSavedProfile();

            if (savedProfile?.role === "traveler") {
                setTargetRoute("/traveler/home");
                setIsLoading(false);
                return;
            }

            if (savedProfile?.role === "operator") {
                setTargetRoute("/operator/home");
                setIsLoading(false);
                return;
            }

            const selectedRole = (await getSelectedRole()) as SelectedAppRole | null;

            if (selectedRole === "traveler" || selectedRole === "operator") {
                setTargetRoute("/entry");
                setIsLoading(false);
                return;
            }

            setTargetRoute("/entry");
            setIsLoading(false);
        };

        void loadIdentity();
    }, []);

    if (isLoading || !targetRoute) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <ActivityIndicator />
            </View>
        );
    }

    return <Redirect href={targetRoute as "/entry"} />;
}
