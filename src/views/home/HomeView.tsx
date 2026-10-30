import Home from '@features/home/Home';

import classes from './HomeView.module.scss';

export default function HomeView() {
  return (
    <main className={classes.home_view}>
      <Home />
    </main>
  );
}
