/** @format */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PaymentSuccessPage() {
    const router = useRouter();

    useEffect(() => {
        // Optionally, you could verify the payment status here
        // by checking URL parameters or making an API call
    }, []);

    return (
        <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
            <Card className="border-green-200 dark:border-green-900">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-3xl">Payment Successful!</CardTitle>
                    <CardDescription className="text-base">
                        Thank you for your purchase. Your subscription has been
                        activated.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertDescription>
                            Your account has been upgraded and you now have access
                            to all premium features. You can manage your subscription
                            and billing information from your account page.
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>What happens next?</p>
                        <ul className="ml-6 list-disc space-y-1">
                            <li>Your subscription is now active</li>
                            <li>All premium features are unlocked</li>
                            <li>You'll receive a confirmation email shortly</li>
                            <li>You can manage your subscription anytime</li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 sm:flex-row">
                    <Button
                        className="w-full sm:w-auto"
                        onClick={() => router.push("/app/account")}
                    >
                        View Account
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => router.push("/app/dashboard")}
                    >
                        Go to Dashboard
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

