'use client';

import { registry } from '@application/di/AppRegistry';

import ChartNetworkIcon from '@ui/icons/chart-network.svg';
import CheckIcon from '@ui/icons/check.svg';

import { createDatasource } from '@utils/datasource';

import classes from './InterviewSuccess.module.scss';

const usersData = createDatasource(registry.usersDatasource);

export default function InterviewSuccess() {
  const { data: profile } = usersData.useGetMe();

  return (
    <div className={classes.success_screen}>
      <header className={classes.success_screen__header}>
        <div className={classes.success_screen__logo_group}>
          <div className={classes.success_screen__logo_icon}>
            <ChartNetworkIcon className={classes.success_screen__logo_glyph} />
          </div>
          <span className={classes.success_screen__logo_text}>Вятка-Флекс</span>
        </div>
        <div className={classes.success_screen__user_actions}>
          <span className={classes.success_screen__user_name}>{profile?.displayName}</span>
          <button type='button' className={classes.success_screen__logout}>
            Выйти
          </button>
        </div>
      </header>
      <main className={classes.success_screen__main}>
        <div className={classes.success_screen__hero}>
          <div className={classes.success_screen__badge}>
            <CheckIcon className={classes.success_screen__check} />
          </div>
          <div className={classes.success_screen__text_stack}>
            <h1 className={classes.success_screen__title}>Вы успешно прошли интервью!</h1>
          </div>
          <div className={classes.success_screen__action_row}>
            <button type='button' className={classes.success_screen__button}>
              Вернуться к процессу
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
