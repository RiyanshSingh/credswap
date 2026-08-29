import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";
import DisputeInterface from "@/components/DisputeInterface";

export default function DisputeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const adminCredentials = (() => {
        try {
            if (localStorage.getItem("admin_auth") !== "true") return null;
            const value = JSON.parse(localStorage.getItem("admin_creds") || "{}");
            return value.username && value.password ? { username: value.username, password: value.password } : null;
        } catch {
            return null;
        }
    })();

    if (!id) return <div>Invalid Dispute ID</div>;

    return (
        <div className="min-h-screen bg-background pb-12">
            <Navbar />

            <div className="container max-w-5xl pt-24 px-4 mx-auto">
                <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>

                <h1 className="text-2xl font-bold mb-6 text-white">Marketplace Dispute</h1>

                <DisputeInterface disputeId={id} adminCredentials={adminCredentials} />
            </div>
        </div>
    );
}
