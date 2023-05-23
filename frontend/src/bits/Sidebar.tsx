import React, { useState } from 'react';

import { useDisclosure } from '@mantine/hooks';
import { Drawer, Button, Group } from '@mantine/core';
import { Profile } from './Profile';

//create react fc for sidebar
export const Sidebar: React.FC = function () {
    const [opened, { open, close }] = useDisclosure(true);
    return <>
        <Drawer opened={opened} onClose={close} title="Authentication">
            <Profile />
        </Drawer>

        <Group position="left">
            <Button onClick={open}>=</Button>
        </Group>
    </>
}