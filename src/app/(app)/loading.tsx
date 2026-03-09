import { Card, CardContent, CardHeader } from "@/components/ui/card";

function LoadingBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-muted ${className}`} />;
}

export default function AppLoading() {
  return (
    <div className="grid gap-6">
      <Card className="rounded-3xl">
        <CardHeader className="gap-3">
          <LoadingBlock className="h-4 w-28" />
          <LoadingBlock className="h-10 w-56" />
          <LoadingBlock className="h-4 w-full max-w-2xl" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <LoadingBlock key={index} className="h-28 w-full" />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <LoadingBlock className="h-6 w-40" />
            <LoadingBlock className="h-4 w-64" />
          </CardHeader>
          <CardContent className="grid gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <LoadingBlock key={index} className="h-24 w-full" />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <LoadingBlock className="h-6 w-36" />
            <LoadingBlock className="h-4 w-52" />
          </CardHeader>
          <CardContent className="grid gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <LoadingBlock key={index} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
