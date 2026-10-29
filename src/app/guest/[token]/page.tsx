import GuestRequestForm from "./request-form";

export default async function GuestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <GuestRequestForm token={token} />;
}
