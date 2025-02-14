import { getCard } from "@mhsalves/yugioh-fb-catalog";
import { Card, DialogContent, DialogTitle, Divider, Grid2, Stack, Typography } from "@mui/material";

interface CardItemViewProps {
    id: number;
    onlyAvailable?: boolean;
}

function CardItemView(props: CardItemViewProps) {
    const { id, onlyAvailable = true } = props;

    const card = getCard(id);

    if (onlyAvailable && !card) return null;

    return (
        <Grid2 size={{ xs: 6, sm: 4, md: 3 }}>
            <Card>
                <DialogTitle variant="body2">#{id}</DialogTitle>
                <Divider /> 
                <DialogContent>
                    {!card && (<Typography variant="body2" color="red">Not available yet</Typography>)}
                    {card && (
                        <Stack spacing={1}>
                            <Typography><b>Name:</b> {card.name}</Typography>
                            <Divider />
                            <Typography><b>Description:</b> <br/> {card.description}</Typography>
                            <Divider />
                            <Typography><b>Card Type:</b> {card.cardType}</Typography>
                            <Divider />
                            <Typography><b>Code:</b> {card.password.code}</Typography>
                            <Typography><b>Cost:</b> {card.password.cost}</Typography>
                        </Stack>
                    )}
                </DialogContent>
            </Card>
        </Grid2>
    );
}

export default CardItemView;
