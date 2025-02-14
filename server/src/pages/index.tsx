import React, { useState } from "react";
import { CardContent, Card, Grid2, Stack, Switch, Typography } from "@mui/material";
import { PageContainer } from "@toolpad/core";

import Header from "../components/Header";
import CardItemView from "../components/CardItemView";

const TOTAL_CARDS = 721;

export default function CardPage() {
    const [onlyAvailable, setOnlyAvailable] = useState(true);
    const handleChangeAvailable = (_: any, checked: boolean) => {
        setOnlyAvailable(checked);
    };

    return (
        <PageContainer>
            <title>Cards registered</title>
            <Header title="Cards registered" />
            <CardContent sx={{ flexGrow: 1, mt: 3 }}>
                <Stack direction="row" justifyContent="flex-end" alignItems="center" mb={2}>
                    <Typography variant="caption">Only Available</Typography>
                    <Switch defaultChecked={onlyAvailable} onChange={handleChangeAvailable} />
                </Stack>
                <Grid2 container spacing={2}>
                    {Array(TOTAL_CARDS).fill(0).map((_, index) => (
                        <CardItemView id={index + 1} onlyAvailable={onlyAvailable} key={`card-${index + 1}`} />
                    ))}
                </Grid2>
            </CardContent>
        </PageContainer>
    );
}
