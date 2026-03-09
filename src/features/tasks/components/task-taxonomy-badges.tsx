import { Badge } from "@/components/ui/badge";

type TaskTaxonomyBadgesProps = {
  projectName: string | null;
  tagNames: string[];
};

export function TaskTaxonomyBadges({
  projectName,
  tagNames,
}: TaskTaxonomyBadgesProps) {
  if (!projectName && tagNames.length === 0) {
    return null;
  }

  return (
    <>
      {projectName ? <Badge variant="outline">{projectName}</Badge> : null}
      {tagNames.map((tagName) => (
        <Badge key={tagName} variant="outline">
          #{tagName}
        </Badge>
      ))}
    </>
  );
}
