import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";
import DisputeInterface from "@/components/DisputeInterface";

export default function DisputeDetails() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const type = (searchParams.get("type") as 'marketplace' | 'task') || 'marketplace';

    if (!id) return <div>Invalid Dispute ID</div>;

    return (
        <div className="min-h-screen bg-background pb-12">
            <Navbar />

            <div className="container max-w-5xl pt-24 px-4 mx-auto">
                <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>

                <h1 className="text-2xl font-bold mb-6">
                    {type === 'task' ? 'Task Dispute' : 'Marketplace Dispute'}
                </h1>

                <DisputeInterface disputeId={id} userRole="user" type={type} />
            </div>
        </div>
    );
}
