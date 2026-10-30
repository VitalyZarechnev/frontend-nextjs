import clsx from 'clsx';

import classes from './Spinner.module.scss';

type TProps = {
  size?: number;
  color?: 'core' | 'invert';
  className?: string;
};

export default function Spinner(props: TProps) {
  const { size = 24, color = 'core', className } = props;

  return (
    <div className={clsx(classes.spinner_container, className)}>
      <svg
        className={clsx(classes.spinner_svg, classes.spinning, {
          [classes.spinnerSvg__color_invert]: color === 'invert',
        })}
        xmlns='http://www.w3.org/2000/svg'
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
      >
        <path
          d='M4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4'
          stroke='currentColor'
          strokeWidth='1.6'
          strokeLinecap='round'
        />
      </svg>
    </div>
  );
}
