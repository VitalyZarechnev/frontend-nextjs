'use client';

import Button from '@ui/atoms/button/Button';
import Flex from '@ui/atoms/flex/Flex';
import Content from '@ui/atoms/typography/Content';
import Heading from '@ui/atoms/typography/Heading';
import Modal from '@ui/molecules/modal/Modal';

type TProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog(props: TProps) {
  const { open, title, description, confirmLabel = 'Подтвердить', cancelLabel = 'Отмена', isPending = false, onConfirm, onCancel } = props;

  return (
    <Modal open={open} onClose={onCancel}>
      <Flex vertical gap={24}>
        <Flex vertical gap={8}>
          <Heading variant='h3'>{title}</Heading>
          <Content>{description}</Content>
        </Flex>
        <Flex gap={12}>
          <Button variant='secondary' disabled={isPending} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant='main' disabled={isPending} loading={isPending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
}
