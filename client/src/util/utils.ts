export const getPossessiveName = (name: string, you?: boolean) => {
    if (you) {
        return "Din"
    }
    return name.match(/[sSxXzZ]$/) ? name : name + "s"
}