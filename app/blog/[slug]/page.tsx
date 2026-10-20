import type { Metadata } from "next";
import ContentPostDetail, {
  generateContentPostMetadata,
} from "../../components/ContentPostDetail";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateContentPostMetadata({
    params,
    listLabel: "Blog",
  });
}

export default function BlogPostPage({ params }: Props) {
  return (
    <ContentPostDetail
      params={params}
      listLabel="Blog"
      listHref="/blog"
    />
  );
}
