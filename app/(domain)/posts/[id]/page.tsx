import PostDetailView from '@views/posts/PostDetailView';

type TProps = {
  params: Promise<{ id: string }>;
};

export default async function PostDetailPage(props: TProps) {
  const { id } = await props.params;

  return <PostDetailView id={id} />;
}
