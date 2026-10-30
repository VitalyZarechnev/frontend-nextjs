import PostDetail from '@features/post-detail/PostDetail';

import classes from './PostDetailView.module.scss';

type TProps = {
  id: string;
};

export default function PostDetailView(props: TProps) {
  const { id } = props;

  return (
    <main className={classes.post_detail_view}>
      <PostDetail id={id} />
    </main>
  );
}
